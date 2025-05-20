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
import { CreateFactionDto } from './dto/create-faction.dto';
import { UpdateFactionDto } from './dto/update-faction.dto';
import { FactionDto } from './dto/faction.dto';
import { FactionNodeProperties, FactionType } from './entities/faction.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FactionsService {
  constructor(@Inject(NEO4J_DRIVER) private readonly neo4jDriver: Driver) {}

  private neo4jDateTimeToDate(dateTime: Neo4jDateTime | string): Date {
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

  private mapRecordToFactionDto(record: Neo4jRecord): FactionDto {
    const factionNode = record.get('f') as {
      properties: FactionNodeProperties;
    };
    const factionProperties = factionNode.properties;
    const worldId = record.get('worldId') as string;

    return {
      id: factionProperties.id,
      name: factionProperties.name,
      description: factionProperties.description,
      type: factionProperties.type,
      ideology: factionProperties.ideology,
      worldId: worldId,
      createdAt: this.neo4jDateTimeToDate(factionProperties.createdAt),
      updatedAt: this.neo4jDateTimeToDate(factionProperties.updatedAt),
    };
  }

  async create(
    createFactionDto: CreateFactionDto,
    currentUserId: string,
  ): Promise<FactionDto> {
    const session: Session = this.neo4jDriver.session();
    try {
      const worldCheckResult: QueryResult = await session.run(
        `MATCH (w:World {id: $worldId})<-[:OWNS]-(u:User {id: $currentUserId})
         RETURN w.id`,
        { worldId: createFactionDto.worldId, currentUserId },
      );

      if (worldCheckResult.records.length === 0) {
        const anyWorldResult = await session.run(
          'MATCH (w:World {id: $worldId}) RETURN w.id',
          { worldId: createFactionDto.worldId },
        );
        if (anyWorldResult.records.length === 0) {
          throw new NotFoundException(
            `World with ID "${createFactionDto.worldId}" not found.`,
          );
        }
        throw new ForbiddenException(
          `You do not own the world with ID "${createFactionDto.worldId}" or it does not exist.`,
        );
      }

      const factionId = uuidv4();
      const now = new Date().toISOString();

      const result: QueryResult = await session.run(
        `MATCH (w:World {id: $worldId})
         CREATE (f:Faction {
           id: $id,
           name: $name,
           description: $description,
           type: $type,
           ideology: $ideology,
           createdAt: datetime($createdAt),
           updatedAt: datetime($updatedAt)
         })
         CREATE (f)-[:BELONGS_TO_WORLD]->(w)
         RETURN f, w.id as worldId`,
        {
          worldId: createFactionDto.worldId,
          id: factionId,
          name: createFactionDto.name,
          description: createFactionDto.description ?? null,
          type: createFactionDto.type ?? FactionType.OTHER,
          ideology: createFactionDto.ideology ?? null,
          createdAt: now,
          updatedAt: now,
        },
      );

      if (result.records.length === 0) {
        throw new Error(
          'Failed to create faction node or BELONGS_TO_WORLD relationship.',
        );
      }
      return this.mapRecordToFactionDto(result.records[0]);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      console.error('Error creating faction:', error);
      throw new Error(
        `Could not create faction: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }

  async findAllByWorld(
    worldId: string,
    currentUserId: string,
  ): Promise<FactionDto[]> {
    const session: Session = this.neo4jDriver.session();
    try {
      const worldCheckResult: QueryResult = await session.run(
        `MATCH (w:World {id: $worldId})<-[:OWNS]-(u:User {id: $currentUserId})
         RETURN w.id`,
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
          `You do not have permission to view factions in world "${worldId}".`,
        );
      }

      const result: QueryResult = await session.run(
        `MATCH (f:Faction)-[:BELONGS_TO_WORLD]->(w:World {id: $worldId})
         // OPTIONAL MATCH (f)-[:HAS_LEADER]->(leader:Character) // Example for fetching leader
         RETURN f, w.id as worldId // , leader // if fetching leader
         ORDER BY f.name ASC`,
        { worldId },
      );
      return result.records.map((record) => this.mapRecordToFactionDto(record));
    } finally {
      await session.close();
    }
  }

  async findOneById(
    factionId: string,
    currentUserId: string,
  ): Promise<FactionDto | null> {
    const session: Session = this.neo4jDriver.session();
    try {
      const result: QueryResult = await session.run(
        `MATCH (f:Faction {id: $factionId})-[:BELONGS_TO_WORLD]->(w:World)<-[:OWNS]-(u:User {id: $currentUserId})
         // OPTIONAL MATCH (f)-[:HAS_LEADER]->(leader:Character)
         RETURN f, w.id as worldId // , leader`,
        { factionId, currentUserId },
      );
      if (result.records.length === 0) {
        const anyFactionResult = await session.run(
          `MATCH (f:Faction {id: $factionId})-[:BELONGS_TO_WORLD]->(w:World) RETURN f, w.id as worldId`,
          { factionId },
        );
        if (anyFactionResult.records.length === 0) return null;
        throw new ForbiddenException(
          'You do not have permission to view this faction.',
        );
      }
      return this.mapRecordToFactionDto(result.records[0]);
    } finally {
      await session.close();
    }
  }

  async update(
    factionId: string,
    updateFactionDto: UpdateFactionDto,
    currentUserId: string,
  ): Promise<FactionDto> {
    const session: Session = this.neo4jDriver.session();
    try {
      const now = new Date().toISOString();
      const params = {
        factionId,
        updatedAt: now,
        currentUserId,
        ...updateFactionDto,
      };

      const setClauses = Object.keys(updateFactionDto)
        .filter((key) => updateFactionDto[key] !== undefined)
        .map((key) => `f.${key} = $${key}`)
        .join(', ');

      if (!setClauses)
        throw new BadRequestException('Update data cannot be empty.');

      const query = `
           MATCH (f:Faction {id: $factionId})-[:BELONGS_TO_WORLD]->(w:World)<-[:OWNS]-(u:User {id: $currentUserId})
           SET ${setClauses}, f.updatedAt = datetime($updatedAt)
           RETURN f, w.id as worldId // , leader (if also fetching leader)
       `;
      const result: QueryResult = await session.run(query, params);

      if (result.records.length === 0) {
        const checkFactionExists = await session.run(
          `MATCH (f:Faction {id: $factionId}) RETURN f`,
          { factionId },
        );
        if (checkFactionExists.records.length === 0)
          throw new NotFoundException(
            `Faction with ID "${factionId}" not found.`,
          );
        throw new ForbiddenException(
          `You do not have permission to update faction "${factionId}".`,
        );
      }
      return this.mapRecordToFactionDto(result.records[0]);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      )
        throw error;
      console.error('Error updating faction:', error);
      throw new Error(
        `Could not update faction: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }

  async remove(
    factionId: string,
    currentUserId: string,
  ): Promise<{ message: string }> {
    const session: Session = this.neo4jDriver.session();
    try {
      const permissionCheck: QueryResult = await session.run(
        `MATCH (f:Faction {id: $factionId})-[:BELONGS_TO_WORLD]->(w:World)<-[:OWNS]-(u:User {id: $currentUserId})
         RETURN f.id`,
        { factionId, currentUserId },
      );
      if (permissionCheck.records.length === 0) {
        const existenceCheck = await session.run(
          'MATCH (f:Faction {id: $factionId}) RETURN f.id',
          { factionId },
        );
        if (existenceCheck.records.length === 0)
          throw new NotFoundException(
            `Faction with ID "${factionId}" not found.`,
          );
        throw new ForbiddenException(
          `You do not have permission to delete faction "${factionId}".`,
        );
      }
      await session.run(`MATCH (f:Faction {id: $factionId}) DETACH DELETE f`, {
        factionId,
      });
      return {
        message: `Faction with ID "${factionId}" successfully deleted.`,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      console.error('Error deleting faction:', error);
      throw new Error(
        `Could not delete faction: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }
}
