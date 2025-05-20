// backend/src/date-entries/date-entries.service.ts
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
  int,
  Integer as Neo4jInteger,
} from 'neo4j-driver';
import { NEO4J_DRIVER } from '../database/neo4j/neo4j.constants';
import { CreateDateEntryDto } from './dto/create-date-entry.dto';
import { UpdateDateEntryDto } from './dto/update-date-entry.dto';
import { DateEntryDto } from './dto/date-entry.dto';
import { DateEntryNodeProperties } from './entities/date-entry.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DateEntriesService {
  constructor(@Inject(NEO4J_DRIVER) private readonly neo4jDriver: Driver) {}

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

  private neo4jIntToNumber(value: any): number | undefined {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'number') return value;
    if (value instanceof Neo4jInteger) {
      return value.toNumber();
    }
    if (typeof value === 'string') {
      const num = parseInt(value, 10);
      if (!isNaN(num)) return num;
    }
    console.warn('neo4jIntToNumber received unexpected type:', value);
    return undefined;
  }

  private mapRecordToDateEntryDto(record: Neo4jRecord): DateEntryDto {
    const dateNodeProps = record.get('d') as {
      properties: DateEntryNodeProperties;
    };
    const dateNodeProperties = dateNodeProps.properties;
    const worldId = record.get('worldId') as string;

    return {
      id: dateNodeProperties.id,
      name: dateNodeProperties.name,
      description: dateNodeProperties.description,
      startDate: this.neo4jIntToNumber(dateNodeProperties.startDate),
      endDate: this.neo4jIntToNumber(dateNodeProperties.endDate),
      era: dateNodeProperties.era,
      worldId: worldId,
      createdAt: this.neo4jDateTimeToJSDate(dateNodeProperties.createdAt),
      updatedAt: this.neo4jDateTimeToJSDate(dateNodeProperties.updatedAt),
    };
  }

  async create(
    createDateEntryDto: CreateDateEntryDto,
    currentUserId: string,
  ): Promise<DateEntryDto> {
    const session: Session = this.neo4jDriver.session();
    try {
      if (
        createDateEntryDto.startDate !== undefined &&
        createDateEntryDto.endDate !== undefined &&
        createDateEntryDto.endDate < createDateEntryDto.startDate
      ) {
        throw new BadRequestException('End date cannot be before start date.');
      }

      // Corrected world check
      const worldCheckResult: QueryResult = await session.run(
        `MATCH (w:World {id: $worldId})<-[:OWNS]-(u:User {id: $currentUserId}) RETURN w.id`,
        { worldId: createDateEntryDto.worldId, currentUserId },
      );

      if (worldCheckResult.records.length === 0) {
        const anyWorldResult = await session.run(
          'MATCH (w:World {id: $worldId}) RETURN w.id',
          { worldId: createDateEntryDto.worldId },
        );
        if (anyWorldResult.records.length === 0)
          throw new NotFoundException(
            `World with ID "${createDateEntryDto.worldId}" not found.`,
          );
        throw new ForbiddenException(
          `You do not own the world with ID "${createDateEntryDto.worldId}" or it does not exist.`,
        );
      }

      const dateEntryId = uuidv4();
      const now = new Date().toISOString();

      const result: QueryResult = await session.run(
        `MATCH (w:World {id: $worldId})
           CREATE (d:DateEntry {
             id: $id,
             name: $name,
             description: $description,
             startDate: $startDate,
             endDate: $endDate,
             era: $era,
             createdAt: datetime($createdAt),
             updatedAt: datetime($updatedAt)
           })
           CREATE (d)-[:BELONGS_TO_WORLD]->(w)
           RETURN d, w.id as worldId`,
        {
          worldId: createDateEntryDto.worldId,
          id: dateEntryId,
          name: createDateEntryDto.name,
          description: createDateEntryDto.description ?? null,
          startDate:
            createDateEntryDto.startDate !== undefined
              ? int(createDateEntryDto.startDate) // Use neo4j.int()
              : null,
          endDate:
            createDateEntryDto.endDate !== undefined
              ? int(createDateEntryDto.endDate) // Use neo4j.int()
              : null,
          era: createDateEntryDto.era ?? null,
          createdAt: now,
          updatedAt: now,
        },
      );

      if (result.records.length === 0)
        throw new Error('Failed to create date entry node.');
      return this.mapRecordToDateEntryDto(result.records[0]);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      )
        throw error;
      console.error('Error creating date entry:', error);
      throw new Error(
        `Could not create date entry: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }

  async update(
    dateEntryId: string,
    updateDateEntryDto: UpdateDateEntryDto,
    currentUserId: string,
  ): Promise<DateEntryDto> {
    const session: Session = this.neo4jDriver.session();
    try {
      let existingStartDate: number | undefined;
      let existingEndDate: number | undefined;

      // Fetch existing node to get current startDate/endDate for validation if only one is being updated
      const existingNodeResult = await session.run(
        `MATCH (d:DateEntry {id: $dateEntryId})-[:BELONGS_TO_WORLD]->(:World)<-[:OWNS]-(u:User {id: $currentUserId})
           RETURN d.startDate as startDate, d.endDate as endDate`, // Ensure these are returned by Cypher
        { dateEntryId, currentUserId },
      );

      if (existingNodeResult.records.length === 0) {
        // Check if node exists at all before throwing Forbidden
        const anyNodeResult = await session.run(
          'MATCH (d:DateEntry {id: $dateEntryId}) RETURN d.id',
          { dateEntryId },
        );
        if (anyNodeResult.records.length === 0) {
          throw new NotFoundException(
            `Date entry with ID "${dateEntryId}" not found.`,
          );
        }
        throw new ForbiddenException(
          `You do not have permission to update date entry "${dateEntryId}".`,
        );
      }

      if (existingNodeResult.records.length > 0) {
        const record = existingNodeResult.records[0];
        existingStartDate = this.neo4jIntToNumber(record.get('startDate'));
        existingEndDate = this.neo4jIntToNumber(record.get('endDate'));
      }

      const newStartDate =
        updateDateEntryDto.startDate !== undefined
          ? updateDateEntryDto.startDate
          : existingStartDate;
      const newEndDate =
        updateDateEntryDto.endDate !== undefined
          ? updateDateEntryDto.endDate
          : existingEndDate;

      if (
        newStartDate !== undefined &&
        newEndDate !== undefined &&
        newEndDate < newStartDate
      ) {
        throw new BadRequestException('End date cannot be before start date.');
      }

      const now = new Date().toISOString();
      const paramsToSet: { [key: string]: any; updatedAt: string } = {
        updatedAt: now,
      };
      const setClauses: string[] = ['d.updatedAt = datetime($updatedAt)'];

      let key: keyof UpdateDateEntryDto;
      for (key in updateDateEntryDto) {
        if (Object.prototype.hasOwnProperty.call(updateDateEntryDto, key)) {
          const value = updateDateEntryDto[key];
          if (value !== undefined) {
            // Process if value is provided (even if it's null)
            if (key === 'startDate' || key === 'endDate') {
              paramsToSet[key] = value === null ? null : int(value); // Handle explicit null
            } else {
              paramsToSet[key] = value;
            }
            setClauses.push(`d.${key} = $${key}`);
          }
        }
      }

      if (setClauses.length <= 1)
        // Only updatedAt clause
        throw new BadRequestException('Update data cannot be empty.');

      const finalParams = { dateEntryId, currentUserId, ...paramsToSet };
      const query = `
             MATCH (d:DateEntry {id: $dateEntryId})-[:BELONGS_TO_WORLD]->(w:World)<-[:OWNS]-(u:User {id: $currentUserId})
             SET ${setClauses.join(', ')}
             RETURN d, w.id as worldId
         `;
      const result: QueryResult = await session.run(query, finalParams);

      // The previous check for existingNodeResult.records.length should cover most permission/existence issues
      // but this is a final check post-update attempt.
      if (result.records.length === 0) {
        throw new Error(
          'Update failed. Date entry not found or no permission after attempting update.',
        );
      }
      return this.mapRecordToDateEntryDto(result.records[0]);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      )
        throw error;
      console.error('Error updating date entry:', error);
      throw new Error(
        `Could not update date entry: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }

  async findAllByWorld(
    worldId: string,
    currentUserId: string, // Now used
  ): Promise<DateEntryDto[]> {
    const session: Session = this.neo4jDriver.session();
    try {
      // Corrected world check
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
          `You do not have permission to view date entries in world "${worldId}".`,
        );
      }

      const result: QueryResult = await session.run(
        `MATCH (d:DateEntry)-[:BELONGS_TO_WORLD]->(w:World {id: $worldId})
           RETURN d, w.id as worldId ORDER BY d.startDate ASC, d.name ASC`,
        { worldId },
      );
      return result.records.map((record) =>
        this.mapRecordToDateEntryDto(record),
      );
    } finally {
      await session.close();
    }
  }

  async findOneById(
    dateEntryId: string, // Now used
    currentUserId: string, // Now used
  ): Promise<DateEntryDto | null> {
    const session: Session = this.neo4jDriver.session();
    try {
      // Corrected query with permission check
      const result: QueryResult = await session.run(
        `MATCH (d:DateEntry {id: $dateEntryId})-[:BELONGS_TO_WORLD]->(w:World)<-[:OWNS]-(u:User {id: $currentUserId})
           RETURN d, w.id as worldId`,
        { dateEntryId, currentUserId },
      );
      if (result.records.length === 0) {
        const anyDateEntryResult = await session.run(
          `MATCH (d:DateEntry {id: $dateEntryId})-[:BELONGS_TO_WORLD]->(w:World) RETURN d, w.id as worldId`,
          { dateEntryId },
        );
        if (anyDateEntryResult.records.length === 0) return null; // Genuinely not found
        throw new ForbiddenException(
          'You do not have permission to view this date entry.',
        ); // Found but no permission
      }
      return this.mapRecordToDateEntryDto(result.records[0]);
    } finally {
      await session.close();
    }
  }

  async remove(
    dateEntryId: string, // Now used
    currentUserId: string, // Now used
  ): Promise<{ message: string }> {
    const session: Session = this.neo4jDriver.session();
    try {
      // Corrected permission check
      const permissionCheck: QueryResult = await session.run(
        `MATCH (d:DateEntry {id: $dateEntryId})-[:BELONGS_TO_WORLD]->(w:World)<-[:OWNS]-(u:User {id: $currentUserId})
           RETURN d.id`,
        { dateEntryId, currentUserId },
      );
      if (permissionCheck.records.length === 0) {
        const existenceCheck = await session.run(
          'MATCH (d:DateEntry {id: $dateEntryId}) RETURN d.id',
          { dateEntryId },
        );
        if (existenceCheck.records.length === 0)
          throw new NotFoundException(
            `Date entry with ID "${dateEntryId}" not found.`,
          );
        throw new ForbiddenException(
          `You do not have permission to delete date entry "${dateEntryId}".`,
        );
      }
      await session.run(
        `MATCH (d:DateEntry {id: $dateEntryId}) DETACH DELETE d`,
        { dateEntryId },
      );
      return {
        message: `Date entry with ID "${dateEntryId}" successfully deleted.`,
      };
    } catch (error) {
      // Catch block now handles error
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      console.error('Error deleting date entry:', error);
      throw new Error( // Ensure a value is always returned or an error thrown
        `Could not delete date entry: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }
}
