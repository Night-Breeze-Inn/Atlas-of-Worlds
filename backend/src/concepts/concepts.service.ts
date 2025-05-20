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
} from 'neo4j-driver';
import { NEO4J_DRIVER } from '../database/neo4j/neo4j.constants';
import { CreateConceptDto } from './dto/create-concept.dto';
import { UpdateConceptDto } from './dto/update-concept.dto';
import { ConceptDto } from './dto/concept.dto';
import { ConceptNodeProperties } from './entities/concept.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ConceptsService {
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

  private mapRecordToConceptDto(record: Neo4jRecord): ConceptDto {
    const conceptNodeProps = record.get('c') as {
      properties: ConceptNodeProperties;
    };
    const conceptNodeProperties = conceptNodeProps.properties;
    const worldId = record.get('worldId') as string;

    return {
      id: conceptNodeProperties.id,
      name: conceptNodeProperties.name,
      description: conceptNodeProperties.description,
      category: conceptNodeProperties.category,
      worldId: worldId,
      createdAt: this.neo4jDateTimeToJSDate(conceptNodeProperties.createdAt),
      updatedAt: this.neo4jDateTimeToJSDate(conceptNodeProperties.updatedAt),
    };
  }

  async create(
    createConceptDto: CreateConceptDto,
    currentUserId: string,
  ): Promise<ConceptDto> {
    const session: Session = this.neo4jDriver.session();
    try {
      const worldCheckResult: QueryResult = await session.run(
        `MATCH (w:World {id: $worldId})<-[:OWNS]-(u:User {id: $currentUserId}) RETURN w.id`,
        { worldId: createConceptDto.worldId, currentUserId },
      );
      if (worldCheckResult.records.length === 0) {
        const anyWorldResult = await session.run(
          'MATCH (w:World {id: $worldId}) RETURN w.id',
          { worldId: createConceptDto.worldId },
        );
        if (anyWorldResult.records.length === 0)
          throw new NotFoundException(
            `World with ID "${createConceptDto.worldId}" not found.`,
          );
        throw new ForbiddenException(
          `You do not own the world with ID "${createConceptDto.worldId}" or it does not exist.`,
        );
      }

      const conceptId = uuidv4();
      const now = new Date().toISOString();

      const result: QueryResult = await session.run(
        `MATCH (w:World {id: $worldId})
         CREATE (c:Concept {
           id: $id,
           name: $name,
           description: $description,
           category: $category,
           createdAt: datetime($createdAt),
           updatedAt: datetime($updatedAt)
         })
         CREATE (c)-[:BELONGS_TO_WORLD]->(w)
         RETURN c, w.id as worldId`,
        {
          worldId: createConceptDto.worldId,
          id: conceptId,
          name: createConceptDto.name,
          description: createConceptDto.description ?? null,
          category: createConceptDto.category ?? null,
          createdAt: now,
          updatedAt: now,
        },
      );

      if (result.records.length === 0)
        throw new Error('Failed to create concept node.');
      return this.mapRecordToConceptDto(result.records[0]);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      console.error('Error creating concept:', error);
      throw new Error(
        `Could not create concept: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }

  async update(
    conceptId: string,
    updateConceptDto: UpdateConceptDto,
    currentUserId: string,
  ): Promise<ConceptDto> {
    const session: Session = this.neo4jDriver.session();
    try {
      const now = new Date().toISOString();
      const paramsToSet: { [key: string]: any; updatedAt: string } = {
        updatedAt: now,
      };
      const setClauses: string[] = ['c.updatedAt = datetime($updatedAt)'];

      let key: keyof UpdateConceptDto;
      for (key in updateConceptDto) {
        if (
          Object.prototype.hasOwnProperty.call(updateConceptDto, key) &&
          updateConceptDto[key] !== undefined
        ) {
          paramsToSet[key] = updateConceptDto[key];
          setClauses.push(`c.${key} = $${key}`);
        }
      }

      if (setClauses.length <= 1)
        throw new BadRequestException('Update data cannot be empty.');

      const finalParams = { conceptId, currentUserId, ...paramsToSet };
      const query = `
           MATCH (c:Concept {id: $conceptId})-[:BELONGS_TO_WORLD]->(w:World)<-[:OWNS]-(u:User {id: $currentUserId})
           SET ${setClauses.join(', ')}
           RETURN c, w.id as worldId
       `;
      const result: QueryResult = await session.run(query, finalParams);

      if (result.records.length === 0) {
        const checkConceptExists = await session.run(
          `MATCH (c:Concept {id: $conceptId}) RETURN c`,
          { conceptId },
        );
        if (checkConceptExists.records.length === 0)
          throw new NotFoundException(
            `Concept with ID "${conceptId}" not found.`,
          );
        throw new ForbiddenException(
          `You do not have permission to update concept "${conceptId}".`,
        );
      }
      return this.mapRecordToConceptDto(result.records[0]);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      )
        throw error;
      console.error('Error updating concept:', error);
      throw new Error(
        `Could not update concept: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }

  async findAllByWorld(
    worldId: string,
    currentUserId: string,
  ): Promise<ConceptDto[]> {
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
          `You do not have permission to view concepts in world "${worldId}".`,
        );
      }
      const result: QueryResult = await session.run(
        `MATCH (c:Concept)-[:BELONGS_TO_WORLD]->(w:World {id: $worldId})
         RETURN c, w.id as worldId ORDER BY c.category ASC, c.name ASC`,
        { worldId },
      );
      return result.records.map((record) => this.mapRecordToConceptDto(record));
    } finally {
      await session.close();
    }
  }

  async findOneById(
    conceptId: string,
    currentUserId: string,
  ): Promise<ConceptDto | null> {
    const session: Session = this.neo4jDriver.session();
    try {
      const result: QueryResult = await session.run(
        `MATCH (c:Concept {id: $conceptId})-[:BELONGS_TO_WORLD]->(w:World)<-[:OWNS]-(u:User {id: $currentUserId})
         RETURN c, w.id as worldId`,
        { conceptId, currentUserId },
      );
      if (result.records.length === 0) {
        const anyConceptResult = await session.run(
          `MATCH (c:Concept {id: $conceptId})-[:BELONGS_TO_WORLD]->(w:World) RETURN c, w.id as worldId`,
          { conceptId },
        );
        if (anyConceptResult.records.length === 0) return null;
        throw new ForbiddenException(
          'You do not have permission to view this concept.',
        );
      }
      return this.mapRecordToConceptDto(result.records[0]);
    } finally {
      await session.close();
    }
  }

  async remove(
    conceptId: string,
    currentUserId: string,
  ): Promise<{ message: string }> {
    const session: Session = this.neo4jDriver.session();
    try {
      const permissionCheck: QueryResult = await session.run(
        `MATCH (c:Concept {id: $conceptId})-[:BELONGS_TO_WORLD]->(w:World)<-[:OWNS]-(u:User {id: $currentUserId})
         RETURN c.id`,
        { conceptId, currentUserId },
      );
      if (permissionCheck.records.length === 0) {
        const existenceCheck = await session.run(
          'MATCH (c:Concept {id: $conceptId}) RETURN c.id',
          { conceptId },
        );
        if (existenceCheck.records.length === 0)
          throw new NotFoundException(
            `Concept with ID "${conceptId}" not found.`,
          );
        throw new ForbiddenException(
          `You do not have permission to delete concept "${conceptId}".`,
        );
      }
      await session.run(`MATCH (c:Concept {id: $conceptId}) DETACH DELETE c`, {
        conceptId,
      });
      return {
        message: `Concept with ID "${conceptId}" successfully deleted.`,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      console.error('Error deleting concept:', error);
      throw new Error(
        `Could not delete concept: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }
}
