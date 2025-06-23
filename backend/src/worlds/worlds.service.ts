import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
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
import { UsersService } from '../users/users.service';
import { v4 as uuidv4 } from 'uuid';

// Import interfaces from the shared types package
import type {
  WorldDto as IWorldDto,
  CreateWorldDto as ICreateWorldDto, // Interface for the data shape from client
  UpdateWorldDto as IUpdateWorldDto,
  UserDto as IUserDto,
} from '@atlas-of-worlds/types';

// Import DTO classes for NestJS validation and class-based operations
import { CreateWorldDto } from './dto/create-world.dto';
import { UpdateWorldDto } from './dto/update-world.dto';
// If you have a WorldDto class in ./dto/world.dto.ts, you might use it for internal consistency checks
// import { WorldDto } from './dto/world.dto';

// Assuming OwnerNodeProperties is internal to this service or defined based on Neo4j structure
interface OwnerNodeProperties {
  id: string;
  username: string;
  email: string;
  createdAt: Neo4jDateTime | string;
  updatedAt: Neo4jDateTime | string;
}

// Assuming WorldNodeProperties is also internal or based on Neo4j structure
interface WorldNodeProperties {
  id: string;
  name: string;
  description?: string;
  defaultMoneySystem?: string;
  createdAt: Neo4jDateTime | string;
  updatedAt: Neo4jDateTime | string;
}

@Injectable()
export class WorldsService {
  constructor(
    @Inject(NEO4J_DRIVER) private readonly neo4jDriver: Driver,
    private readonly usersService: UsersService, // Assuming UsersService returns IUserDto or compatible
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
      // Return a default or throw a more specific error
      return new Date(0); // Or handle more gracefully
    }
    return new Date(
      dateTime.year.toInt(),
      dateTime.month.toInt() - 1, // Month is 0-indexed in JS Date
      dateTime.day.toInt(),
      dateTime.hour.toInt(),
      dateTime.minute.toInt(),
      dateTime.second.toInt(),
      dateTime.nanosecond.toInt() / 1000000,
    );
  }

  // This mapper function now returns the shared IWorldDto interface
  private mapRecordToWorldDto(record: Neo4jRecord): IWorldDto {
    const worldNode = record.get('w') as Node<number, WorldNodeProperties>;
    const ownerNode = record.get('o') as Node<number, OwnerNodeProperties>; // Assuming 'o' is the alias for owner

    const worldProperties = worldNode.properties;
    const ownerProperties = ownerNode.properties;

    const ownerDto: IUserDto = {
      id: ownerProperties.id,
      username: ownerProperties.username,
      email: ownerProperties.email,
      createdAt: this.neo4jDateTimeToDate(
        ownerProperties.createdAt,
      ).toISOString(),
      updatedAt: this.neo4jDateTimeToDate(
        ownerProperties.updatedAt,
      ).toISOString(),
    };

    return {
      id: worldProperties.id,
      name: worldProperties.name,
      description: worldProperties.description,
      defaultMoneySystem: worldProperties.defaultMoneySystem,
      createdAt: this.neo4jDateTimeToDate(
        worldProperties.createdAt,
      ).toISOString(),
      updatedAt: this.neo4jDateTimeToDate(
        worldProperties.updatedAt,
      ).toISOString(),
      owner: ownerDto,
    };
  }

  // Method signature uses the class CreateWorldDto for validation by NestJS pipes
  // but the internal logic might align with ICreateWorldDto and returns IWorldDto
  async create(
    createWorldDto: CreateWorldDto, // This is the class DTO from ./dto
    ownerIdFromJwt: string,
  ): Promise<IWorldDto> {
    // Return type is the shared interface
    const session: Session = this.neo4jDriver.session();
    try {
      // UsersService.findOneById should ideally return IUserDto or compatible
      const owner = await this.usersService.findOneById(ownerIdFromJwt);
      if (!owner) {
        throw new NotFoundException(
          `User with ID "${ownerIdFromJwt}" not found. Cannot create world.`,
        );
      }

      const worldId = uuidv4();
      const now = new Date().toISOString();

      // createWorldDto (the class) aligns with ICreateWorldDto (the interface)
      // for properties like name, description, defaultMoneySystem.
      const result: QueryResult = await session.run(
        `MATCH (ownerUserNode:User {id: $ownerId})
           CREATE (w:World {
             id: $id,
             name: $name,
             description: $description,
             defaultMoneySystem: $defaultMoneySystem,
             createdAt: datetime($createdAt),
             updatedAt: datetime($updatedAt)
           })
           CREATE (ownerUserNode)-[:OWNS]->(w)
           RETURN w, ownerUserNode as o`, // 'o' alias for owner node
        {
          ownerId: ownerIdFromJwt,
          id: worldId,
          name: createWorldDto.name,
          description: createWorldDto.description ?? null,
          defaultMoneySystem: createWorldDto.defaultMoneySystem ?? null,
          createdAt: now,
          updatedAt: now,
        },
      );

      if (result.records.length === 0) {
        // This case should ideally not happen if MATCH and CREATE were successful
        throw new InternalServerErrorException(
          'Failed to create world and retrieve its record.',
        );
      }
      return this.mapRecordToWorldDto(result.records[0]);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      )
        throw error;
      console.error('Error creating world:', error);
      throw new Error( // Generic error for other unexpected issues
        `Could not create world: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }

  async findAllByOwner(ownerId: string): Promise<IWorldDto[]> {
    // Returns array of shared interface
    // UsersService.findOneById should return IUserDto or compatible
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
    } catch (error) {
      console.error(`Error in findAllByOwner for owner ${ownerId}:`, error);
      throw new InternalServerErrorException(
        'Could not retrieve worlds by owner.',
      );
    } finally {
      await session.close();
    }
  }

  async findOneById(
    worldId: string,
    currentUserId: string,
  ): Promise<IWorldDto | null> {
    // Returns shared interface or null
    const session: Session = this.neo4jDriver.session();
    try {
      const result: QueryResult = await session.run(
        `MATCH (w:World {id: $worldId})<-[:OWNS]-(owner:User {id: $currentUserId})
          RETURN w, owner as o`,
        { worldId, currentUserId },
      );

      if (result.records.length === 0) {
        const anyWorldResult = await session.run(
          'MATCH (w:World {id: $worldId}) RETURN w', // Check existence
          { worldId },
        );
        if (anyWorldResult.records.length === 0) {
          return null; // World genuinely not found
        }
        // World exists but user doesn't own it or is not the current user
        throw new ForbiddenException(
          'You do not have permission to view this world.',
        );
      }
      return this.mapRecordToWorldDto(result.records[0]);
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException // If called internally and world not found by other means
      )
        throw error;
      console.error(`Error in findOneById for world ${worldId}:`, error);
      throw new InternalServerErrorException('Could not retrieve world.');
    } finally {
      await session.close();
    }
  }

  // Method signature uses the class UpdateWorldDto for validation by NestJS pipes
  async update(
    worldId: string,
    updateWorldDto: UpdateWorldDto, // This is the class DTO from ./dto
    currentUserId: string,
  ): Promise<IWorldDto> {
    // Returns shared interface
    const session: Session = this.neo4jDriver.session();
    try {
      // First, check if the world exists and if the current user is the owner.
      // This also fetches the current owner data for the return object.
      const existingWorldResult = await session.run(
        `MATCH (w:World {id: $worldId})<-[:OWNS]-(owner:User)
           RETURN w, owner as o`, // 'o' as alias
        { worldId },
      );

      if (existingWorldResult.records.length === 0) {
        throw new NotFoundException(`World with ID "${worldId}" not found.`);
      }

      const ownerNodeFromResult = existingWorldResult.records[0].get(
        'o',
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
        currentUserId, // Though already used for auth check, can be part of params if query needs it
      };

      const setClauses: string[] = [];
      // Iterate over IUpdateWorldDto properties for type safety if possible,
      // or directly over updateWorldDto (class instance)
      let key: keyof UpdateWorldDto; // Or keyof IUpdateWorldDto if updateWorldDto aligns perfectly
      for (key in updateWorldDto) {
        if (Object.prototype.hasOwnProperty.call(updateWorldDto, key)) {
          // Check if the property actually exists on the DTO to avoid undefined keys
          if (updateWorldDto[key] !== undefined) {
            setClauses.push(`w.${key} = $${key}`);
            params[key] = updateWorldDto[key];
          }
        }
      }

      if (setClauses.length === 0) {
        // No actual data to update, return current state
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
        // Should not happen if previous checks passed, but as a safeguard
        throw new InternalServerErrorException(
          'Failed to update world. World not found after update attempt or permission issue.',
        );
      }
      return this.mapRecordToWorldDto(result.records[0]);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof InternalServerErrorException
      )
        throw error;
      console.error('Error updating world:', error);
      throw new Error( // Generic error for other unexpected issues
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
      // Verify ownership before attempting to delete
      const ownershipCheckResult = await session.run(
        `MATCH (owner:User {id: $currentUserId})-[r:OWNS]->(w:World {id: $worldId})
           RETURN w.id as worldIdFound`, // Ensure we get a field back
        { worldId, currentUserId },
      );

      if (ownershipCheckResult.records.length === 0) {
        // If no relationship, check if world exists to give a more specific error
        const anyWorldResult = await session.run(
          'MATCH (w:World {id: $worldId}) RETURN w.id',
          { worldId },
        );
        if (anyWorldResult.records.length === 0) {
          throw new NotFoundException(`World with ID "${worldId}" not found.`);
        }
        // World exists, but current user does not own it
        throw new ForbiddenException(
          'You do not have permission to delete this world.',
        );
      }

      // If ownership is confirmed, proceed with deletion
      // DETACH DELETE will remove the world node and all its relationships
      await session.run(
        `MATCH (w:World {id: $worldId})
           WHERE EXISTS((:User {id: $currentUserId})-[:OWNS]->(w)) // Double check ownership in the delete query
           DETACH DELETE w`,
        { worldId, currentUserId }, // Pass currentUserId for the WHERE clause
      );
      return { message: `World with ID "${worldId}" successfully deleted.` };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      console.error('Error deleting world:', error);
      throw new InternalServerErrorException( // More generic for unexpected issues during delete
        `Could not delete world: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }
}
