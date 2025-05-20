import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Driver, Session } from 'neo4j-driver';
import { NEO4J_DRIVER } from '../database/neo4j/neo4j.constants';
import {
  CreateRelationshipDto,
  AllowedRelationshipTypes,
  RelationshipPropertiesDto,
} from './dto/create-relationship.dto';

function sanitizeForCypher(input: string): string {
  return input.replace(/[^a-zA-Z0-9_]/g, '');
}

function mapNodeTypeToLabel(nodeType: string): string {
  const mapping: Record<string, string> = {
    users: 'User',
    worlds: 'World',
    locations: 'Location',
    characters: 'Character',
    factions: 'Faction',
    items: 'Item',
    events: 'Event',
    concepts: 'Concept',
    'date-entries': 'DateEntry',
  };
  const label: string | undefined = mapping[nodeType.toLowerCase()];
  if (!label) {
    throw new BadRequestException(`Invalid node type specified: ${nodeType}`);
  }
  return label;
}

@Injectable()
export class RelationshipsService {
  constructor(@Inject(NEO4J_DRIVER) private readonly neo4jDriver: Driver) {}

  async createRelationship(
    startNodeType: string,
    startNodeId: string,
    endNodeType: string,
    endNodeId: string,
    createRelationshipDto: CreateRelationshipDto,
    currentUserId: string,
  ): Promise<any> {
    const session: Session = this.neo4jDriver.session();
    try {
      const startLabel = mapNodeTypeToLabel(startNodeType);
      const endLabel = mapNodeTypeToLabel(endNodeType);
      const relationshipType = sanitizeForCypher(
        createRelationshipDto.relationshipType,
      );

      const authCheckQuery = `
        MATCH (startNode:${startLabel} {id: $startNodeId}), (endNode:${endLabel} {id: $endNodeId})
        OPTIONAL MATCH (startNode)-[:BELONGS_TO_WORLD]->(startWorld:World)
        OPTIONAL MATCH (endNode)-[:BELONGS_TO_WORLD]->(endWorld:World)
        WITH startNode, endNode, 
             coalesce(startWorld, CASE WHEN $startLabel = 'World' THEN startNode ELSE null END) as sW,
             coalesce(endWorld, CASE WHEN $endLabel = 'World' THEN endNode ELSE null END) as eW
        WHERE (sW IS NOT NULL AND eW IS NOT NULL AND sW.id = eW.id AND EXISTS((sW)<-[:OWNS]-(:User {id: $currentUserId})))
           OR (sW IS NULL AND eW IS NOT NULL AND EXISTS((eW)<-[:OWNS]-(:User {id: $currentUserId})))
           OR (sW IS NOT NULL AND eW IS NULL AND EXISTS((sW)<-[:OWNS]-(:User {id: $currentUserId})))
           OR ($startLabel = 'User' AND $endLabel = 'World' AND startNode.id = $currentUserId)
        RETURN startNode, endNode, sW as world
      `;

      const authCheckParams = {
        startNodeId,
        endNodeId,
        currentUserId,
        startLabel,
        endLabel,
      };

      let effectiveAuthQuery = authCheckQuery;
      if (
        (startLabel === 'User' &&
          endLabel === 'World' &&
          relationshipType === AllowedRelationshipTypes['OWNS']) ||
        (startLabel === 'World' &&
          endLabel === 'User' &&
          relationshipType === 'OWNED_BY')
      ) {
        effectiveAuthQuery = `
            MATCH (startNode:${startLabel} {id: $startNodeId}), (endNode:${endLabel} {id: $endNodeId})
            WHERE startNode.id = $currentUserId OR endNode.id = $currentUserId
            RETURN startNode, endNode
          `;
      }

      const authResult = await session.run(effectiveAuthQuery, authCheckParams);

      if (authResult.records.length === 0) {
        const startExists = await session.run(
          `MATCH (n:${startLabel} {id: $startNodeId}) RETURN n.id`,
          { startNodeId },
        );
        const endExists = await session.run(
          `MATCH (n:${endLabel} {id: $endNodeId}) RETURN n.id`,
          { endNodeId },
        );
        if (startExists.records.length === 0)
          throw new NotFoundException(
            `${startLabel} with ID ${startNodeId} not found.`,
          );
        if (endExists.records.length === 0)
          throw new NotFoundException(
            `${endLabel} with ID ${endNodeId} not found.`,
          );
        throw new ForbiddenException(
          `Permission denied to create relationship or nodes not in an accessible world.`,
        );
      }

      const queryParams: { [key: string]: any } = {
        startNodeId,
        endNodeId,
      };
      const cypherPropsToSet: string[] = [];

      if (createRelationshipDto.properties) {
        let dtoKey: keyof RelationshipPropertiesDto;
        for (dtoKey in createRelationshipDto.properties) {
          if (
            Object.prototype.hasOwnProperty.call(
              createRelationshipDto.properties,
              dtoKey,
            )
          ) {
            const value = createRelationshipDto.properties[dtoKey];
            if (value !== undefined) {
              cypherPropsToSet.push(`${dtoKey}: $${dtoKey}`);
              queryParams[dtoKey] = value;
            }
          }
        }
      }

      const propertiesCypher =
        cypherPropsToSet.length > 0 ? `{${cypherPropsToSet.join(', ')}}` : '';

      const createRelQuery = `
        MATCH (startNode:${startLabel} {id: $startNodeId})
        MATCH (endNode:${endLabel} {id: $endNodeId})
        MERGE (startNode)-[r:${relationshipType} ${propertiesCypher}]->(endNode)
        RETURN type(r) as type, properties(r) as props, startNode.name as fromName, endNode.name as toName
      `;

      console.log('--- DEBUG START ---');
      console.log(
        'createRelationshipDto.properties:',
        JSON.stringify(createRelationshipDto.properties, null, 2),
      );
      console.log('Final queryParams:', JSON.stringify(queryParams, null, 2));
      console.log('Final propertiesCypher string:', propertiesCypher);
      console.log('Final createRelQuery:', createRelQuery);
      console.log('--- DEBUG END ---');

      const result = await session.run(createRelQuery, queryParams);

      if (result.records.length === 0) {
        throw new InternalServerErrorException(
          'Failed to create relationship.',
        );
      }
      const record = result.records[0];
      return {
        type: record.get('type') as string,
        from: record.get('fromName') as string,
        to: record.get('toName') as string,
        properties: record.get('props') as object,
      };
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error creating relationship:', error);
      const errorMessage =
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: string }).message
          : String(error);
      throw new InternalServerErrorException(
        `Could not create relationship: ${errorMessage}`,
      );
    } finally {
      await session.close();
    }
  }

  async deleteRelationship(
    startNodeType: string,
    startNodeId: string,
    endNodeType: string,
    endNodeId: string,
    relationshipType: AllowedRelationshipTypes,
    currentUserId: string,
  ): Promise<{ message: string }> {
    const session: Session = this.neo4jDriver.session();
    try {
      const startLabel = mapNodeTypeToLabel(startNodeType);
      const endLabel = mapNodeTypeToLabel(endNodeType);
      const sanitizedRelType = sanitizeForCypher(relationshipType);

      const queryParams = { startNodeId, endNodeId, currentUserId };
      const deleteQuery = `
        MATCH (startNode:${startLabel} {id: $startNodeId})
        MATCH (endNode:${endLabel} {id: $endNodeId})
        MATCH (startNode)-[r:${sanitizedRelType}]->(endNode)
        WHERE
          (EXISTS {
            MATCH (startNode)-[:BELONGS_TO_WORLD]->(world1:World)<-[:OWNS]-(:User {id: $currentUserId}),
                  (endNode)-[:BELONGS_TO_WORLD]->(world2:World)
            WHERE world1.id = world2.id
          }) OR
          ($startLabel = 'User' AND startNode.id = $currentUserId AND EXISTS {
            MATCH (endNode)-[:BELONGS_TO_WORLD]->(:World)<-[:OWNS]-(:User {id: $currentUserId})
          }) OR
          ($endLabel = 'User' AND endNode.id = $currentUserId AND EXISTS {
            MATCH (startNode)-[:BELONGS_TO_WORLD]->(:World)<-[:OWNS]-(:User {id: $currentUserId})
          }) OR
          ($startLabel = 'User' AND startNode.id = $currentUserId AND $endLabel = 'World' AND relationshipType = '${AllowedRelationshipTypes.OWNS_ITEM /* TODO: Replace with actual OWNS_WORLD type */}')


        DELETE r
        RETURN count(r) as deletedCount
      `;
      const result = await session.run(deleteQuery, queryParams);

      let deletedCount = 0;
      if (result.records.length > 0) {
        const deletedCountValue: unknown =
          result.records[0].get('deletedCount');
        if (
          deletedCountValue !== null &&
          typeof deletedCountValue === 'object' &&
          typeof (deletedCountValue as { toInt?: unknown }).toInt === 'function'
        ) {
          deletedCount = (deletedCountValue as { toInt: () => number }).toInt();
        }
      }

      if (deletedCount === 0) {
        const relExistsCheck = await session.run(
          `MATCH (s:${startLabel} {id: $startNodeId})-[rel:${sanitizedRelType}]->(e:${endLabel} {id: $endNodeId}) RETURN rel`,
          { startNodeId, endNodeId },
        );
        if (relExistsCheck.records.length === 0) {
          const startNodeExists = await session.run(
            `MATCH (s:${startLabel} {id: $startNodeId}) RETURN s.id`,
            { startNodeId },
          );
          const endNodeExists = await session.run(
            `MATCH (e:${endLabel} {id: $endNodeId}) RETURN e.id`,
            { endNodeId },
          );
          if (startNodeExists.records.length === 0)
            throw new NotFoundException(
              `${startLabel} with ID ${startNodeId} not found.`,
            );
          if (endNodeExists.records.length === 0)
            throw new NotFoundException(
              `${endLabel} with ID ${endNodeId} not found.`,
            );
          throw new NotFoundException(
            `Relationship '${sanitizedRelType}' not found between the specified nodes.`,
          );
        }
        throw new ForbiddenException(
          `Permission denied to delete this relationship, or nodes are not in an authorized context.`,
        );
      }

      return {
        message: `Relationship '${sanitizedRelType}' from ${startNodeType} ${startNodeId} to ${endNodeType} ${endNodeId} deleted successfully.`,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      console.error('Error deleting relationship:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Could not delete relationship: ${errorMessage}`,
      );
    } finally {
      await session.close();
    }
  }
}
