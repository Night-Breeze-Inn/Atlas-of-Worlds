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
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemDto } from './dto/item.dto';
import {
  ItemType,
  ItemRarity,
  ItemNodeProperties,
} from './entities/item.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ItemsService {
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

  private mapRecordToItemDto(record: Neo4jRecord): ItemDto {
    const itemNodeProps = record.get('i') as { properties: ItemNodeProperties };
    const itemProps = itemNodeProps.properties;
    const worldId = record.get('worldId') as string;

    let parsedProperties: Record<string, any> = {};
    if (itemProps.propertiesString) {
      try {
        parsedProperties = JSON.parse(itemProps.propertiesString) as Record<
          string,
          unknown
        >;
      } catch (e) {
        console.error(
          `Failed to parse propertiesString for item ${itemProps.id}:`,
          itemProps.propertiesString,
          e,
        );
      }
    }

    return {
      id: itemProps.id,
      name: itemProps.name,
      description: itemProps.description,
      type: itemProps.type,
      rarity: itemProps.rarity,
      properties: parsedProperties,
      worldId: worldId,
      createdAt: this.neo4jDateTimeToDate(itemProps.createdAt),
      updatedAt: this.neo4jDateTimeToDate(itemProps.updatedAt),
    };
  }

  async create(
    createItemDto: CreateItemDto,
    currentUserId: string,
  ): Promise<ItemDto> {
    const session: Session = this.neo4jDriver.session();
    try {
      const worldCheckResult: QueryResult = await session.run(
        `MATCH (w:World {id: $worldId})<-[:OWNS]-(u:User {id: $currentUserId})
           RETURN w.id`,
        { worldId: createItemDto.worldId, currentUserId },
      );

      if (worldCheckResult.records.length === 0) {
        const anyWorldResult = await session.run(
          'MATCH (w:World {id: $worldId}) RETURN w.id',
          { worldId: createItemDto.worldId },
        );
        if (anyWorldResult.records.length === 0) {
          throw new NotFoundException(
            `World with ID "${createItemDto.worldId}" not found.`,
          );
        }
        throw new ForbiddenException(
          `You do not own the world with ID "${createItemDto.worldId}" or it does not exist.`,
        );
      }

      const itemId = uuidv4();
      const now = new Date().toISOString();
      const propertiesString = createItemDto.properties
        ? JSON.stringify(createItemDto.properties)
        : null;

      const result: QueryResult = await session.run(
        `MATCH (w:World {id: $worldId})
           CREATE (i:Item {
             id: $id,
             name: $name,
             description: $description,
             type: $type,
             rarity: $rarity,
             propertiesString: $propertiesString, // Storing as string
             createdAt: datetime($createdAt),
             updatedAt: datetime($updatedAt)
           })
           CREATE (i)-[:BELONGS_TO_WORLD]->(w)
           RETURN i, w.id as worldId`,
        {
          worldId: createItemDto.worldId,
          id: itemId,
          name: createItemDto.name,
          description: createItemDto.description ?? null,
          type: createItemDto.type ?? ItemType.OTHER,
          rarity: createItemDto.rarity ?? ItemRarity.COMMON,
          propertiesString: propertiesString,
          createdAt: now,
          updatedAt: now,
        },
      );

      if (result.records.length === 0) {
        throw new Error(
          'Failed to create item node or BELONGS_TO_WORLD relationship.',
        );
      }
      return this.mapRecordToItemDto(result.records[0]);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      console.error('Error creating item:', error);
      throw new Error(
        `Could not create item: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }

  async update(
    itemId: string,
    updateItemDto: UpdateItemDto,
    currentUserId: string,
  ): Promise<ItemDto> {
    const session: Session = this.neo4jDriver.session();
    try {
      const now = new Date().toISOString();

      const paramsToSet: Record<string, any> = { updatedAt: now };
      const setClauses: string[] = ['i.updatedAt = datetime($updatedAt)'];

      for (const key in updateItemDto) {
        const typedKey = key as keyof UpdateItemDto;
        if (
          Object.prototype.hasOwnProperty.call(updateItemDto, typedKey) &&
          updateItemDto[typedKey] !== undefined
        ) {
          if (typedKey === 'properties') {
            const props = updateItemDto.properties;
            paramsToSet['propertiesString'] = props
              ? JSON.stringify(props)
              : null;
            setClauses.push(`i.propertiesString = $propertiesString`);
          } else {
            paramsToSet[typedKey] = updateItemDto[typedKey];
            setClauses.push(`i.${typedKey} = $${typedKey}`);
          }
        }
      }

      if (setClauses.length <= 1) {
        throw new BadRequestException(
          'Update data cannot be empty (excluding updatedAt).',
        );
      }

      const finalParams = {
        itemId,
        currentUserId,
        ...paramsToSet,
      };

      const query = `
             MATCH (i:Item {id: $itemId})-[:BELONGS_TO_WORLD]->(w:World)<-[:OWNS]-(u:User {id: $currentUserId})
             SET ${setClauses.join(', ')}
             RETURN i, w.id as worldId
         `;
      const result: QueryResult = await session.run(query, finalParams);

      if (result.records.length === 0) {
        const checkItemExists = await session.run(
          `MATCH (i:Item {id: $itemId}) RETURN i`,
          { itemId },
        );
        if (checkItemExists.records.length === 0)
          throw new NotFoundException(`Item with ID "${itemId}" not found.`);
        throw new ForbiddenException(
          `You do not have permission to update item "${itemId}".`,
        );
      }
      return this.mapRecordToItemDto(result.records[0]);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      )
        throw error;
      console.error('Error updating item:', error);
      throw new Error(
        `Could not update item: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }

  async findAllByWorld(
    worldId: string,
    currentUserId: string,
  ): Promise<ItemDto[]> {
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
          `You do not have permission to view items in world "${worldId}".`,
        );
      }

      const result: QueryResult = await session.run(
        `MATCH (i:Item)-[:BELONGS_TO_WORLD]->(w:World {id: $worldId})
           RETURN i, w.id as worldId
           ORDER BY i.name ASC`,
        { worldId },
      );
      return result.records.map((record) => this.mapRecordToItemDto(record));
    } finally {
      await session.close();
    }
  }

  async findOneById(
    itemId: string,
    currentUserId: string,
  ): Promise<ItemDto | null> {
    const session: Session = this.neo4jDriver.session();
    try {
      const result: QueryResult = await session.run(
        `MATCH (i:Item {id: $itemId})-[:BELONGS_TO_WORLD]->(w:World)<-[:OWNS]-(u:User {id: $currentUserId})
           RETURN i, w.id as worldId`,
        { itemId, currentUserId },
      );
      if (result.records.length === 0) {
        const anyItemResult = await session.run(
          `MATCH (i:Item {id: $itemId})-[:BELONGS_TO_WORLD]->(w:World) RETURN i, w.id as worldId`,
          { itemId },
        );
        if (anyItemResult.records.length === 0) return null;
        throw new ForbiddenException(
          'You do not have permission to view this item.',
        );
      }
      return this.mapRecordToItemDto(result.records[0]);
    } finally {
      await session.close();
    }
  }

  async remove(
    itemId: string,
    currentUserId: string,
  ): Promise<{ message: string }> {
    const session: Session = this.neo4jDriver.session();
    try {
      const permissionCheck: QueryResult = await session.run(
        `MATCH (i:Item {id: $itemId})-[:BELONGS_TO_WORLD]->(w:World)<-[:OWNS]-(u:User {id: $currentUserId})
           RETURN i.id`,
        { itemId, currentUserId },
      );
      if (permissionCheck.records.length === 0) {
        const existenceCheck = await session.run(
          'MATCH (i:Item {id: $itemId}) RETURN i.id',
          { itemId },
        );
        if (existenceCheck.records.length === 0)
          throw new NotFoundException(`Item with ID "${itemId}" not found.`);
        throw new ForbiddenException(
          `You do not have permission to delete item "${itemId}".`,
        );
      }
      await session.run(`MATCH (i:Item {id: $itemId}) DETACH DELETE i`, {
        itemId,
      });
      return { message: `Item with ID "${itemId}" successfully deleted.` };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      console.error('Error deleting item:', error);
      throw new Error(
        `Could not delete item: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await session.close();
    }
  }
}
