import {
  IsNotEmpty,
  IsString,
  IsObject,
  IsOptional,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AllowedRelationshipTypes {
  // Character to Faction
  MEMBER_OF = 'MEMBER_OF',
  ALLIED_WITH_FACTION = 'ALLIED_WITH_FACTION',
  ENEMY_OF_FACTION = 'ENEMY_OF_FACTION',
  FOUNDED_FACTION = 'FOUNDED_FACTION',
  // Character to Character
  KNOWS = 'KNOWS',
  ALLY_OF_CHARACTER = 'ALLY_OF_CHARACTER',
  ENEMY_OF_CHARACTER = 'ENEMY_OF_CHARACTER',
  FAMILY_RELATIONSHIP_IS = 'FAMILY_RELATIONSHIP_IS',
  PROFESSIONAL_RELATIONSHIP_IS = 'PROFESSIONAL_RELATIONSHIP_IS',
  // Character to Location
  BORN_IN = 'BORN_IN',
  DIED_IN = 'DIED_IN',
  RESIDES_IN = 'RESIDES_IN',
  VISITED = 'VISITED',
  RULES_OVER_LOCATION = 'RULES_OVER_LOCATION',
  // Character to Event
  PARTICIPATED_IN = 'PARTICIPATED_IN',
  WITNESSED = 'WITNESSED',
  CAUSED_EVENT = 'CAUSED_EVENT',
  VICTIM_OF_EVENT = 'VICTIM_OF_EVENT',
  // Character to Item
  OWNS_ITEM = 'OWNS_ITEM',
  WIELDS_ITEM = 'WIELDS_ITEM',
  CREATED_ITEM = 'CREATED_ITEM',
  SEEKS_ITEM = 'SEEKS_ITEM',
  // Character to Concept
  BELIEVES_IN = 'BELIEVES_IN',
  STUDIED_CONCEPT = 'STUDIED_CONCEPT',
  MASTERED_CONCEPT = 'MASTERED_CONCEPT',
  // Faction specific
  HAS_LEADER = 'HAS_LEADER',
  // Location specific
  LOCATED_IN = 'LOCATED_IN',
  // Event specific
  OCCURRED_DURING_ERA = 'OCCURRED_DURING_ERA',
}

export class RelationshipPropertiesDto {
  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  joinDate?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  significance?: string;
}

export class CreateRelationshipDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(AllowedRelationshipTypes, { message: 'Invalid relationshipType.' })
  relationshipType: AllowedRelationshipTypes;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => RelationshipPropertiesDto)
  properties?: RelationshipPropertiesDto;
}
