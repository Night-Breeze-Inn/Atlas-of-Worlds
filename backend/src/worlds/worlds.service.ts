import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  Driver,
  Session,
  Record as Neo4jRecord,
  QueryResult,
  DateTime as Neo4jDateTime,
  Node,
} from 'neo4j-driver';
import { NEO4J_DRIVER } from '../database/neo4j/neo4j.constants';
import { CreateWorldDto } from './dto/create-world.dto';
import { UpdateWorldDto } from './dto/update-world.dto';
import { WorldDto } from './dto/world.dto';
import { WorldNodeProperties } from './entities/world.entity';
import { UsersService } from '../users/users.service';
import { v4 as uuidv4 } from 'uuid';

interface OwnerNodeProperties {
  id: string;
  username: string;
  email: string;
  createdAt: Neo4jDateTime | string;
  updatedAt: Neo4jDateTime | string;
}

@Injectable()
export class WorldsService {
  constructor(
    @Inject(NEO4J_DRIVER) private readonly neo4jDriver: Driver,
    private readonly usersService: UsersService,
  ) {}

  private neo4jDateTimeToDate(dateTime: Neo4jDateTime | string): Date {
    if (typeof dateTime === 'string') {
      return new Date(dateTime);
    }
    if (
      !dateTime ||
      !dateTime.year ||
      typeof dateTime.year.toInt !== 'function'
    ) {
      console.error('Invalid Neo4jDateTime object received:', dateTime);
      return new Date();
    }
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

  private mapRecordToWorldDto(record: Neo4jRecord): WorldDto {
    const worldNode = record.get('w') as Node<number, WorldNodeProperties>;
    const ownerNode = record.get('o') as Node<number, OwnerNodeProperties>;

    const worldProperties = worldNode.properties;
    const ownerProperties = ownerNode.properties;

    return {
      id: worldProperties.id,
      name: worldProperties.name,
      description: worldProperties.description,
      defaultMoneySystem: worldProperties.defaultMoneySystem,
      createdAt: this.neo4jDateTimeToDate(worldProperties.createdAt),
      updatedAt: this.neo4jDateTimeToDate(worldProperties.updatedAt),
      owner: {
        id: ownerProperties.id,
        username: ownerProperties.username,
        email: ownerProperties.email,
        createdAt: this.neo4jDateTimeToDate(ownerProperties.createdAt),
        updatedAt: this.neo4jDateTimeToDate(ownerProperties.updatedAt),
      },
    };
  }

  async create(createWorldDto: CreateWorldDto): Promise<WorldDto> {
    const session: Session = this.neo4jDriver.session();
    try {
      const owner = await this.usersService.findOneById(createWorldDto.ownerId);
      if (!owner) {
        throw new NotFoundException(
          `User with ID "${createWorldDto.ownerId}" not found. Cannot create world.`,
        );
      }

      const worldId = uuidv4();
      const now = new Date().toISOString();

      const result: QueryResult = await session.run(
        `MATCH (owner:User {id: $ownerId})
           CREATE (w:World {
             id: $id,
             name: $name,
             description: $description,
             defaultMoneySystem: $defaultMoneySystem,
             createdAt: datetime($createdAt),
             updatedAt: datetime($updatedAt)
           })
           CREATE (owner)-[:OWNS]->(w)
           RETURN w, owner as o`,
        {
          ownerId: createWorldDto.ownerId,
          id: worldId,
          name: createWorldDto.name,
          description: createWorldDto.description ?? null,
          defaultMoneySystem: createWorldDto.defaultMoneySystem ?? null,
          createdAt: now,
          updatedAt: now,
        },
      );

      if (result.records.length === 0) {
        throw new Error('Failed to create world node or OWNS relationship.');
      }
      return this.mapRecordToWorldDto(result.records[0]);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error creating world:', error);
      throw new Error(
        `Could not create world: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }

  async findAllByOwner(ownerId: string): Promise<WorldDto[]> {
    const owner = await this.usersService.findOneById(ownerId);
    if (!owner) {
      throw new NotFoundException(`User with ID "${ownerId}" not found.`);
    }

    const session: Session = this.neo4jDriver.session();
    try {
      const result: QueryResult = await session.run(
        `MATCH (owner:User {id: $ownerId})-[:OWNS]->(w:World)
           RETURN w, owner as o
           ORDER BY w.updatedAt DESC`,
        { ownerId },
      );
      return result.records.map((record) => this.mapRecordToWorldDto(record));
    } finally {
      await session.close();
    }
  }

  async findOneById(worldId: string): Promise<WorldDto | null> {
    const session: Session = this.neo4jDriver.session();
    try {
      const result: QueryResult = await session.run(
        `MATCH (w:World {id: $worldId})<-[:OWNS]-(owner:User)
           RETURN w, owner as o`,
        { worldId },
      );

      if (result.records.length === 0) {
        return null;
      }
      return this.mapRecordToWorldDto(result.records[0]);
    } finally {
      await session.close();
    }
  }

  async update(
    worldId: string,
    updateWorldDto: UpdateWorldDto,
    currentUserId: string,
  ): Promise<WorldDto> {
    const session: Session = this.neo4jDriver.session();
    try {
      const existingWorldResult = await session.run(
        `MATCH (w:World {id: $worldId})<-[:OWNS]-(owner:User)
           RETURN w, owner`,
        { worldId },
      );

      if (existingWorldResult.records.length === 0) {
        throw new NotFoundException(`World with ID "${worldId}" not found.`);
      }

      const ownerNodeFromResult = existingWorldResult.records[0].get(
        'owner',
      ) as Node<number, OwnerNodeProperties>;
      const ownerIdFromDb = ownerNodeFromResult.properties.id;

      if (ownerIdFromDb !== currentUserId) {
        throw new ForbiddenException(
          'You do not have permission to update this world.',
        );
      }

      const now = new Date().toISOString();
      const params: Record<string, any> = {
        worldId,
        updatedAt: now,
        currentUserId,
      };

      const setClauses: string[] = [];
      for (const key in updateWorldDto) {
        if (Object.prototype.hasOwnProperty.call(updateWorldDto, key)) {
          const typedKey = key as keyof UpdateWorldDto;
          if (updateWorldDto[typedKey] !== undefined) {
            setClauses.push(`w.${typedKey} = $${typedKey}`);
            params[typedKey] = updateWorldDto[typedKey];
          }
        }
      }

      if (setClauses.length === 0) {
        return this.mapRecordToWorldDto(existingWorldResult.records[0]);
      }

      const setClauseString = setClauses.join(', ');

      const query = `
          MATCH (w:World {id: $worldId})<-[:OWNS]-(owner:User {id: $currentUserId})
          SET ${setClauseString}, w.updatedAt = datetime($updatedAt)
          RETURN w, owner as o
        `;

      const result: QueryResult = await session.run(query, params);

      if (result.records.length === 0) {
        throw new Error(
          'Failed to update world. World not found or permission denied.',
        );
      }
      return this.mapRecordToWorldDto(result.records[0]);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      console.error('Error updating world:', error);
      throw new Error(
        `Could not update world: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }

  async remove(
    worldId: string,
    currentUserId: string,
  ): Promise<{ message: string }> {
    const session: Session = this.neo4jDriver.session();
    try {
      const ownershipCheckResult = await session.run(
        `MATCH (owner:User {id: $currentUserId})-[r:OWNS]->(w:World {id: $worldId})
           RETURN w`,
        { worldId, currentUserId },
      );

      if (ownershipCheckResult.records.length === 0) {
        const anyWorldResult = await session.run(
          'MATCH (w:World {id: $worldId}) RETURN w',
          { worldId },
        );
        if (anyWorldResult.records.length === 0) {
          throw new NotFoundException(`World with ID "${worldId}" not found.`);
        }
        throw new ForbiddenException(
          'You do not have permission to delete this world.',
        );
      }

      await session.run(
        `MATCH (owner:User {id: $currentUserId})-[r:OWNS]->(w:World {id: $worldId})
           DETACH DELETE w`,
        { worldId, currentUserId },
      );
      return { message: `World with ID "${worldId}" successfully deleted.` };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      console.error('Error deleting world:', error);
      throw new Error(
        `Could not delete world: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }
}
