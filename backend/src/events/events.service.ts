import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  Driver,
  Session,
  Record as Neo4jRecord,
  QueryResult,
  DateTime as Neo4jDateTime,
  Date as Neo4jDate,
} from 'neo4j-driver';
import { NEO4J_DRIVER } from '../database/neo4j/neo4j.constants';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventDto } from './dto/event.dto';
import { EventNodeProperties } from './entities/event.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EventsService {
  constructor(@Inject(NEO4J_DRIVER) private readonly neo4jDriver: Driver) {}

  private neo4jTemporalToDate(
    value: Neo4jDateTime | Neo4jDate | string | null | undefined,
  ): Date | undefined {
    if (!value) return undefined;
    if (typeof value === 'string') return new Date(value);
    return new Date(
      value.year.toInt(),
      value.month.toInt() - 1,
      value.day.toInt(),
      (value as Neo4jDateTime).hour?.toInt() || 0,
      (value as Neo4jDateTime).minute?.toInt() || 0,
      (value as Neo4jDateTime).second?.toInt() || 0,
      (value as Neo4jDateTime).nanosecond?.toInt() / 1000000 || 0,
    );
  }

  private neo4jDateTimeToJSDate(dateTime: Neo4jDateTime | string): Date {
    if (typeof dateTime === 'string') return new Date(dateTime);
    return new Date(
      dateTime.year.toInt(),
      dateTime.month.toInt() - 1,
      dateTime.day.toInt(),
      dateTime.hour.toInt(),
      dateTime.minute.toInt(),
      dateTime.second.toInt(),
      dateTime.nanosecond.toInt() / 1000000,
    );
  }

  private mapRecordToEventDto(record: Neo4jRecord): EventDto {
    const eventNode = record.get('e') as {
      properties: EventNodeProperties;
    };
    const eventNodeProps = eventNode.properties;
    const worldId = record.get('worldId') as string;

    const jsEventDate = this.neo4jTemporalToDate(eventNodeProps.eventDate);

    return {
      id: eventNodeProps.id,
      name: eventNodeProps.name,
      description: eventNodeProps.description,
      eventDate: jsEventDate ? jsEventDate.toISOString() : undefined,
      significance: eventNodeProps.significance,
      worldId: worldId,
      createdAt: this.neo4jDateTimeToJSDate(eventNodeProps.createdAt),
      updatedAt: this.neo4jDateTimeToJSDate(eventNodeProps.updatedAt),
    };
  }

  async create(
    createEventDto: CreateEventDto,
    currentUserId: string,
  ): Promise<EventDto> {
    const session: Session = this.neo4jDriver.session();
    try {
      const worldCheckResult: QueryResult = await session.run(
        `MATCH (w:World {id: $worldId})<-[:OWNS]-(u:User {id: $currentUserId})
         RETURN w.id`,
        { worldId: createEventDto.worldId, currentUserId },
      );
      if (worldCheckResult.records.length === 0) {
        /* ... error handling ... */
        const anyWorldResult = await session.run(
          'MATCH (w:World {id: $worldId}) RETURN w.id',
          { worldId: createEventDto.worldId },
        );
        if (anyWorldResult.records.length === 0)
          throw new NotFoundException(
            `World with ID "${createEventDto.worldId}" not found.`,
          );
        throw new ForbiddenException(
          `You do not own the world with ID "${createEventDto.worldId}" or it does not exist.`,
        );
      }

      const eventId = uuidv4();
      const now = new Date().toISOString();

      const eventDateCypher = createEventDto.eventDate
        ? createEventDto.eventDate.includes('T')
          ? `datetime($eventDate)`
          : `date($eventDate)`
        : null;

      const result: QueryResult = await session.run(
        `MATCH (w:World {id: $worldId})
         CREATE (e:Event {
           id: $id,
           name: $name,
           description: $description,
           eventDate: ${eventDateCypher ? eventDateCypher : 'null'},
           significance: $significance,
           createdAt: datetime($createdAt),
           updatedAt: datetime($updatedAt)
         })
         CREATE (e)-[:BELONGS_TO_WORLD]->(w)
         RETURN e, w.id as worldId`,
        {
          worldId: createEventDto.worldId,
          id: eventId,
          name: createEventDto.name,
          description: createEventDto.description ?? null,
          eventDate: createEventDto.eventDate,
          significance: createEventDto.significance ?? null,
          createdAt: now,
          updatedAt: now,
        },
      );

      if (result.records.length === 0)
        throw new Error('Failed to create event node.');
      return this.mapRecordToEventDto(result.records[0]);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      console.error('Error creating event:', error);
      throw new Error(
        `Could not create event: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }

  async update(
    eventId: string,
    updateEventDto: UpdateEventDto,
    currentUserId: string,
  ): Promise<EventDto> {
    const session: Session = this.neo4jDriver.session();
    try {
      const now = new Date().toISOString();
      const paramsToSet: { [key: string]: any; updatedAt: string } = {
        updatedAt: now,
      };
      const setClauses: string[] = ['e.updatedAt = datetime($updatedAt)'];

      let key: keyof UpdateEventDto;
      for (key in updateEventDto) {
        if (
          Object.prototype.hasOwnProperty.call(updateEventDto, key) &&
          updateEventDto[key] !== undefined
        ) {
          if (key === 'eventDate') {
            const dateVal = updateEventDto.eventDate;
            if (dateVal === null) {
              paramsToSet[key] = null;
              setClauses.push(`e.${key} = null`);
            } else if (dateVal) {
              setClauses.push(
                `e.${key} = ${dateVal.includes('T') ? 'datetime($eventDate)' : 'date($eventDate)'}`,
              );
              paramsToSet[key] = dateVal;
            }
          } else {
            paramsToSet[key] = updateEventDto[key];
            setClauses.push(`e.${key} = $${key}`);
          }
        }
      }

      if (setClauses.length <= 1)
        throw new BadRequestException('Update data cannot be empty.');

      const finalParams = { eventId, currentUserId, ...paramsToSet };
      const query = `
           MATCH (e:Event {id: $eventId})-[:BELONGS_TO_WORLD]->(w:World)<-[:OWNS]-(u:User {id: $currentUserId})
           SET ${setClauses.join(', ')}
           RETURN e, w.id as worldId
       `;
      const result: QueryResult = await session.run(query, finalParams);

      if (result.records.length === 0) {
        const checkEventExists = await session.run(
          `MATCH (e:Event {id: $eventId}) RETURN e`,
          { eventId },
        );
        if (checkEventExists.records.length === 0)
          throw new NotFoundException(`Event with ID "${eventId}" not found.`);
        throw new ForbiddenException(
          `You do not have permission to update event "${eventId}".`,
        );
      }
      return this.mapRecordToEventDto(result.records[0]);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      )
        throw error;
      console.error('Error updating event:', error);
      throw new Error(
        `Could not update event: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }

  async findAllByWorld(
    worldId: string,
    currentUserId: string,
  ): Promise<EventDto[]> {
    const session: Session = this.neo4jDriver.session();
    try {
      const worldCheckResult: QueryResult = await session.run(
        `MATCH (w:World {id: $worldId})<-[:OWNS]-(u:User {id: $currentUserId}) RETURN w.id`,
        { worldId, currentUserId },
      );
      if (worldCheckResult.records.length === 0) {
        const anyWorldResult = await session.run(
          'MATCH (w:World {id: $worldId}) RETURN w.id',
          { worldId },
        );
        if (anyWorldResult.records.length === 0)
          throw new NotFoundException(`World with ID "${worldId}" not found.`);
        throw new ForbiddenException(
          `You do not have permission to view events in world "${worldId}".`,
        );
      }
      const result: QueryResult = await session.run(
        `MATCH (e:Event)-[:BELONGS_TO_WORLD]->(w:World {id: $worldId})
         RETURN e, w.id as worldId ORDER BY e.eventDate DESC, e.name ASC`,
        { worldId },
      );
      return result.records.map((record) => this.mapRecordToEventDto(record));
    } finally {
      await session.close();
    }
  }

  async findOneById(
    eventId: string,
    currentUserId: string,
  ): Promise<EventDto | null> {
    const session: Session = this.neo4jDriver.session();
    try {
      const result: QueryResult = await session.run(
        `MATCH (e:Event {id: $eventId})-[:BELONGS_TO_WORLD]->(w:World)<-[:OWNS]-(u:User {id: $currentUserId})
         RETURN e, w.id as worldId`,
        { eventId, currentUserId },
      );
      if (result.records.length === 0) {
        const anyEventResult = await session.run(
          `MATCH (e:Event {id: $eventId})-[:BELONGS_TO_WORLD]->(w:World) RETURN e, w.id as worldId`,
          { eventId },
        );
        if (anyEventResult.records.length === 0) return null;
        throw new ForbiddenException(
          'You do not have permission to view this event.',
        );
      }
      return this.mapRecordToEventDto(result.records[0]);
    } finally {
      await session.close();
    }
  }

  async remove(
    eventId: string,
    currentUserId: string,
  ): Promise<{ message: string }> {
    const session: Session = this.neo4jDriver.session();
    try {
      const permissionCheck: QueryResult = await session.run(
        `MATCH (e:Event {id: $eventId})-[:BELONGS_TO_WORLD]->(w:World)<-[:OWNS]-(u:User {id: $currentUserId})
         RETURN e.id`,
        { eventId, currentUserId },
      );
      if (permissionCheck.records.length === 0) {
        const existenceCheck = await session.run(
          'MATCH (e:Event {id: $eventId}) RETURN e.id',
          { eventId },
        );
        if (existenceCheck.records.length === 0)
          throw new NotFoundException(`Event with ID "${eventId}" not found.`);
        throw new ForbiddenException(
          `You do not have permission to delete event "${eventId}".`,
        );
      }
      await session.run(`MATCH (e:Event {id: $eventId}) DETACH DELETE e`, {
        eventId,
      });
      return { message: `Event with ID "${eventId}" successfully deleted.` };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      console.error('Error deleting event:', error);
      throw new Error(
        `Could not delete event: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }
}
