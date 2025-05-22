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
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { CharacterDto } from './dto/character.dto';
import {
  CharacterNodeProperties,
  CharacterStatus,
  CharacterRole,
} from './entities/character.entity';
import { v4 as uuidv4 } from 'uuid';
import { FactionDto } from '../factions/dto/faction.dto';
import { FactionNodeProperties } from '../factions/entities/faction.entity';
import { RelationshipPropertiesDto } from '../relationships/dto/create-relationship.dto';
import { RelatedNodeDto } from '../relationships/dto/related-node.dto';
import { AllowedRelationshipTypes } from '../relationships/dto/create-relationship.dto';

@Injectable()
export class CharactersService {
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

  private mapRecordToCharacterDto(record: Neo4jRecord): CharacterDto {
    const charNode = record.get('c') as { properties: CharacterNodeProperties };
    const charNodeProperties = charNode.properties;
    const worldId = record.get('worldId') as string;

    return {
      id: charNodeProperties.id,
      name: charNodeProperties.name,
      description: charNodeProperties.description,
      aliases: charNodeProperties.aliases || [],
      appearance: charNodeProperties.appearance,
      status: charNodeProperties.status,
      role: charNodeProperties.role,
      worldId: worldId,
      createdAt: this.neo4jDateTimeToDate(charNodeProperties.createdAt),
      updatedAt: this.neo4jDateTimeToDate(charNodeProperties.updatedAt),
    };
  }

  private mapRecordToFactionWithMembership(
    record: Neo4jRecord,
  ): RelatedNodeDto<FactionDto, RelationshipPropertiesDto> {
    const factionNodeProps = record.get('f') as {
      properties: FactionNodeProperties;
    };
    const factionNodeProperties = factionNodeProps.properties;
    const worldId = record.get('worldId') as string;
    const relProps = record.get('r') as {
      properties: RelationshipPropertiesDto;
    };
    const relPropsProperties = relProps.properties;
    const relType = record.get('relationshipType') as string;

    const factionDto: FactionDto = {
      id: factionNodeProperties.id,
      name: factionNodeProperties.name,
      description: factionNodeProperties.description,
      type: factionNodeProperties.type,
      ideology: factionNodeProperties.ideology,
      worldId: worldId,
      createdAt: this.neo4jDateTimeToDate(factionNodeProperties.createdAt),
      updatedAt: this.neo4jDateTimeToDate(factionNodeProperties.updatedAt),
    };

    return {
      node: factionDto,
      relationshipProperties: relPropsProperties,
      relationshipType: relType,
    };
  }

  async findMemberOfFactions(
    characterId: string,
    currentUserId: string,
  ): Promise<RelatedNodeDto<FactionDto, RelationshipPropertiesDto>[]> {
    const session = this.neo4jDriver.session();
    try {
      const authCheck = await session.run(
        `MATCH (c:Character {id: $characterId})-[:BELONGS_TO_WORLD]->(w:World)<-[:OWNS]-(u:User {id: $currentUserId})
         RETURN c.id`,
        { characterId, currentUserId },
      );
      if (authCheck.records.length === 0) {
        const charExists = await session.run(
          `MATCH (c:Character {id: $characterId}) RETURN c.id`,
          { characterId },
        );
        if (charExists.records.length === 0)
          throw new NotFoundException(
            `Character with ID ${characterId} not found.`,
          );
        throw new ForbiddenException(
          `You do not have permission to view this character's faction memberships.`,
        );
      }

      const result = await session.run(
        `MATCH (c:Character {id: $characterId})-[r:${AllowedRelationshipTypes.MEMBER_OF}]->(f:Faction)
         MATCH (f)-[:BELONGS_TO_WORLD]->(w:World) // To get worldId for FactionDto
         RETURN f, properties(r) as rProps, type(r) as rType, w.id as worldId`,
        { characterId },
      );

      return result.records.map((record) => {
        const factionNode = record.get('f') as {
          properties: FactionNodeProperties;
        };
        const relProps = record.get('rProps') as RelationshipPropertiesDto;
        const relType = record.get('rType') as string;
        const factionWorldId = record.get('worldId') as string;
        const factionNodeProperties = factionNode.properties;

        const factionDto: FactionDto = {
          id: factionNodeProperties.id,
          name: factionNodeProperties.name,
          description: factionNodeProperties.description,
          type: factionNodeProperties.type,
          ideology: factionNodeProperties.ideology,
          worldId: factionWorldId,
          createdAt: this.neo4jDateTimeToDate(factionNodeProperties.createdAt),
          updatedAt: this.neo4jDateTimeToDate(factionNodeProperties.updatedAt),
        };

        return {
          node: factionDto,
          relationshipProperties: relProps,
          relationshipType: relType,
        };
      });
    } finally {
      await session.close();
    }
  }

  async create(
    createCharacterDto: CreateCharacterDto,
    currentUserId: string,
  ): Promise<CharacterDto> {
    const session: Session = this.neo4jDriver.session();
    try {
      const worldCheckResult: QueryResult = await session.run(
        `MATCH (w:World {id: $worldId})<-[:OWNS]-(u:User {id: $currentUserId})
         RETURN w.id`,
        { worldId: createCharacterDto.worldId, currentUserId },
      );

      if (worldCheckResult.records.length === 0) {
        const anyWorldResult = await session.run(
          'MATCH (w:World {id: $worldId}) RETURN w.id',
          { worldId: createCharacterDto.worldId },
        );
        if (anyWorldResult.records.length === 0) {
          throw new NotFoundException(
            `World with ID "${createCharacterDto.worldId}" not found.`,
          );
        }
        throw new ForbiddenException(
          `You do not own the world with ID "${createCharacterDto.worldId}" or it does not exist.`,
        );
      }

      const characterId = uuidv4();
      const now = new Date().toISOString();

      const result: QueryResult = await session.run(
        `MATCH (w:World {id: $worldId})
         CREATE (c:Character {
           id: $id,
           name: $name,
           description: $description,
           aliases: $aliases,
           appearance: $appearance,
           status: $status,
           role: $role,
           createdAt: datetime($createdAt),
           updatedAt: datetime($updatedAt)
         })
         CREATE (c)-[:BELONGS_TO_WORLD]->(w)
         RETURN c, w.id as worldId`,
        {
          worldId: createCharacterDto.worldId,
          id: characterId,
          name: createCharacterDto.name,
          description: createCharacterDto.description ?? null,
          aliases: createCharacterDto.aliases ?? [],
          appearance: createCharacterDto.appearance ?? null,
          status: createCharacterDto.status ?? CharacterStatus.UNKNOWN,
          role: createCharacterDto.role ?? CharacterRole.NPC,
          createdAt: now,
          updatedAt: now,
        },
      );

      if (result.records.length === 0) {
        throw new Error(
          'Failed to create character node or BELONGS_TO_WORLD relationship.',
        );
      }
      return this.mapRecordToCharacterDto(result.records[0]);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      console.error('Error creating character:', error);
      throw new Error(
        `Could not create character: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }

  async findAllByWorld(
    worldId: string,
    currentUserId: string,
  ): Promise<CharacterDto[]> {
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
          `You do not have permission to view characters in world "${worldId}".`,
        );
      }

      const result: QueryResult = await session.run(
        `MATCH (c:Character)-[:BELONGS_TO_WORLD]->(w:World {id: $worldId})
         RETURN c, w.id as worldId
         ORDER BY c.name ASC`,
        { worldId },
      );
      return result.records.map((record) =>
        this.mapRecordToCharacterDto(record),
      );
    } finally {
      await session.close();
    }
  }

  async findOneById(
    characterId: string,
    currentUserId: string,
  ): Promise<CharacterDto | null> {
    const session: Session = this.neo4jDriver.session();
    try {
      const result: QueryResult = await session.run(
        `MATCH (c:Character {id: $characterId})-[:BELONGS_TO_WORLD]->(w:World)<-[:OWNS]-(u:User {id: $currentUserId})
         RETURN c, w.id as worldId`,
        { characterId, currentUserId },
      );
      if (result.records.length === 0) {
        const anyCharResult = await session.run(
          'MATCH (c:Character {id: $characterId})-[:BELONGS_TO_WORLD]->(w:World) RETURN c, w.id as worldId',
          { characterId },
        );
        if (anyCharResult.records.length === 0) return null;
        throw new ForbiddenException(
          'You do not have permission to view this character.',
        );
      }
      return this.mapRecordToCharacterDto(result.records[0]);
    } finally {
      await session.close();
    }
  }

  async update(
    characterId: string,
    updateCharacterDto: UpdateCharacterDto,
    currentUserId: string,
  ): Promise<CharacterDto> {
    const session: Session = this.neo4jDriver.session();
    try {
      const now = new Date().toISOString();
      const params = {
        characterId,
        updatedAt: now,
        currentUserId,
        ...updateCharacterDto,
      };

      const setClauses = Object.keys(updateCharacterDto)
        .filter((key) => updateCharacterDto[key] !== undefined)
        .map((key) => `c.${key} = $${key}`)
        .join(', ');

      if (!setClauses)
        throw new BadRequestException('Update data cannot be empty.');

      const query = `
           MATCH (c:Character {id: $characterId})-[:BELONGS_TO_WORLD]->(w:World)<-[:OWNS]-(u:User {id: $currentUserId})
           SET ${setClauses}, c.updatedAt = datetime($updatedAt)
           RETURN c, w.id as worldId
       `;
      const result: QueryResult = await session.run(query, params);

      if (result.records.length === 0) {
        const checkCharExists = await session.run(
          `MATCH (c:Character {id: $characterId}) RETURN c`,
          { characterId },
        );
        if (checkCharExists.records.length === 0)
          throw new NotFoundException(
            `Character with ID "${characterId}" not found.`,
          );
        throw new ForbiddenException(
          `You do not have permission to update character "${characterId}".`,
        );
      }
      return this.mapRecordToCharacterDto(result.records[0]);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      )
        throw error;
      console.error('Error updating character:', error);
      throw new Error(
        `Could not update character: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }

  async remove(
    characterId: string,
    currentUserId: string,
  ): Promise<{ message: string }> {
    const session: Session = this.neo4jDriver.session();
    try {
      const permissionCheck: QueryResult = await session.run(
        `MATCH (c:Character {id: $characterId})-[:BELONGS_TO_WORLD]->(w:World)<-[:OWNS]-(u:User {id: $currentUserId})
         RETURN c.id`,
        { characterId, currentUserId },
      );
      if (permissionCheck.records.length === 0) {
        const existenceCheck = await session.run(
          'MATCH (c:Character {id: $characterId}) RETURN c.id',
          { characterId },
        );
        if (existenceCheck.records.length === 0)
          throw new NotFoundException(
            `Character with ID "${characterId}" not found.`,
          );
        throw new ForbiddenException(
          `You do not have permission to delete character "${characterId}".`,
        );
      }
      await session.run(
        `MATCH (c:Character {id: $characterId}) DETACH DELETE c`,
        { characterId },
      );
      return {
        message: `Character with ID "${characterId}" successfully deleted.`,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      console.error('Error deleting character:', error);
      throw new Error(
        `Could not delete character: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }
}
