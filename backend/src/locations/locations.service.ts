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
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationDto } from './dto/location.dto';
import { LocationNodeProperties } from './entities/location.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LocationsService {
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

  private mapRecordToLocationDto(record: Neo4jRecord): LocationDto {
    const locationNodeData = record.get('l') as {
      properties: LocationNodeProperties;
    };
    const locationNode = locationNodeData.properties;
    const worldId = record.get('worldId') as string; // Assuming 'worldId' is returned by the query

    return {
      id: locationNode.id,
      name: locationNode.name,
      description: locationNode.description,
      type: locationNode.type,
      worldId: worldId,
      createdAt: this.neo4jDateTimeToDate(locationNode.createdAt),
      updatedAt: this.neo4jDateTimeToDate(locationNode.updatedAt),
    };
  }

  async create(
    createLocationDto: CreateLocationDto,
    currentUserId: string,
  ): Promise<LocationDto> {
    const session: Session = this.neo4jDriver.session();
    try {
      const worldCheckResult: QueryResult = await session.run(
        `MATCH (w:World {id: $worldId})<-[:OWNS]-(u:User {id: $currentUserId})
         RETURN w.id as worldId`,
        { worldId: createLocationDto.worldId, currentUserId },
      );

      if (worldCheckResult.records.length === 0) {
        const anyWorldResult = await session.run(
          'MATCH (w:World {id: $worldId}) RETURN w.id',
          { worldId: createLocationDto.worldId },
        );
        if (anyWorldResult.records.length === 0) {
          throw new NotFoundException(
            `World with ID "${createLocationDto.worldId}" not found.`,
          );
        }
        throw new ForbiddenException(
          `You do not own the world with ID "${createLocationDto.worldId}" or it does not exist.`,
        );
      }

      const locationId = uuidv4();
      const now = new Date().toISOString();

      const result: QueryResult = await session.run(
        `MATCH (w:World {id: $worldId})
         CREATE (l:Location {
           id: $id,
           name: $name,
           description: $description,
           type: $type,
           createdAt: datetime($createdAt),
           updatedAt: datetime($updatedAt)
         })
         CREATE (l)-[:BELONGS_TO_WORLD]->(w)
         RETURN l, w.id as worldId`,
        {
          worldId: createLocationDto.worldId,
          id: locationId,
          name: createLocationDto.name,
          description: createLocationDto.description ?? null,
          type: createLocationDto.type ?? null,
          createdAt: now,
          updatedAt: now,
        },
      );

      if (result.records.length === 0) {
        throw new Error(
          'Failed to create location node or BELONGS_TO_WORLD relationship.',
        );
      }
      return this.mapRecordToLocationDto(result.records[0]);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      console.error('Error creating location:', error);
      throw new Error(
        `Could not create location: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }

  async findAllByWorld(
    worldId: string,
    currentUserId: string,
  ): Promise<LocationDto[]> {
    const session: Session = this.neo4jDriver.session();
    try {
      // Verify user owns the world before listing its locations
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
        if (anyWorldResult.records.length === 0) {
          throw new NotFoundException(`World with ID "${worldId}" not found.`);
        }
        throw new ForbiddenException(
          `You do not have permission to view locations in world "${worldId}".`,
        );
      }

      const result: QueryResult = await session.run(
        `MATCH (l:Location)-[:BELONGS_TO_WORLD]->(w:World {id: $worldId})
         RETURN l, w.id as worldId
         ORDER BY l.name ASC`,
        { worldId },
      );
      return result.records.map((record) =>
        this.mapRecordToLocationDto(record),
      );
    } finally {
      await session.close();
    }
  }

  async findOneById(
    locationId: string,
    currentUserId: string,
  ): Promise<LocationDto | null> {
    const session: Session = this.neo4jDriver.session();
    try {
      const result: QueryResult = await session.run(
        `MATCH (l:Location {id: $locationId})-[:BELONGS_TO_WORLD]->(w:World)<-[:OWNS]-(u:User {id: $currentUserId})
         RETURN l, w.id as worldId`,
        { locationId, currentUserId },
      );

      if (result.records.length === 0) {
        // More specific error: check if location exists at all, then if user has access
        const anyLocationResult = await session.run(
          'MATCH (l:Location {id: $locationId})-[:BELONGS_TO_WORLD]->(w:World) RETURN l, w.id as worldId',
          { locationId },
        );
        if (anyLocationResult.records.length === 0) return null; // Or throw NotFoundException
        throw new ForbiddenException(
          'You do not have permission to view this location.',
        );
      }
      return this.mapRecordToLocationDto(result.records[0]);
    } finally {
      await session.close();
    }
  }

  async update(
    locationId: string,
    updateLocationDto: UpdateLocationDto,
    currentUserId: string,
  ): Promise<LocationDto> {
    const session: Session = this.neo4jDriver.session();
    try {
      const now = new Date().toISOString();
      const params = {
        locationId,
        updatedAt: now,
        currentUserId, // for the MATCH clause
        ...updateLocationDto,
      };

      // Build SET clause dynamically
      const setClauses = Object.keys(updateLocationDto)
        .map((key) => `l.${key} = $${key}`)
        .join(', ');

      if (!setClauses) {
        throw new BadRequestException('Update data cannot be empty.');
      }

      const query = `
           MATCH (l:Location {id: $locationId})-[:BELONGS_TO_WORLD]->(w:World)<-[:OWNS]-(u:User {id: $currentUserId})
           SET ${setClauses}, l.updatedAt = datetime($updatedAt)
           RETURN l, w.id as worldId
       `;

      const result: QueryResult = await session.run(query, params);

      if (result.records.length === 0) {
        // Check if location exists first, then if user has permission
        const checkLocationExists = await session.run(
          `MATCH (l:Location {id: $locationId}) RETURN l`,
          { locationId },
        );
        if (checkLocationExists.records.length === 0) {
          throw new NotFoundException(
            `Location with ID "${locationId}" not found.`,
          );
        }
        throw new ForbiddenException(
          `You do not have permission to update location "${locationId}".`,
        );
      }
      return this.mapRecordToLocationDto(result.records[0]);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      )
        throw error;
      console.error('Error updating location:', error);
      throw new Error(
        `Could not update location: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }

  async remove(
    locationId: string,
    currentUserId: string,
  ): Promise<{ message: string }> {
    const session: Session = this.neo4jDriver.session();
    try {
      // Check permission and existence
      const permissionCheck: QueryResult = await session.run(
        `MATCH (l:Location {id: $locationId})-[:BELONGS_TO_WORLD]->(w:World)<-[:OWNS]-(u:User {id: $currentUserId})
         RETURN l.id`,
        { locationId, currentUserId },
      );

      if (permissionCheck.records.length === 0) {
        const existenceCheck = await session.run(
          'MATCH (l:Location {id: $locationId}) RETURN l.id',
          { locationId },
        );
        if (existenceCheck.records.length === 0) {
          throw new NotFoundException(
            `Location with ID "${locationId}" not found.`,
          );
        }
        throw new ForbiddenException(
          `You do not have permission to delete location "${locationId}".`,
        );
      }

      await session.run(
        `MATCH (l:Location {id: $locationId}) DETACH DELETE l`,
        { locationId },
      );
      return {
        message: `Location with ID "${locationId}" successfully deleted.`,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      console.error('Error deleting location:', error);
      throw new Error(
        `Could not delete location: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }
}
