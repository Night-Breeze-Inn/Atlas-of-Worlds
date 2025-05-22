import {
  IsNotEmpty,
  IsString,
  IsObject,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsBoolean,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AllowedRelationshipTypes {
  /* --- Character Relationships --- */
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

  /* --- Faction Relationships --- */
  // Faction to Character
  HAS_LEADER = 'HAS_LEADER',
  // Faction to Faction
  ALLIED_WITH_FACTION_TO_FACTION = 'ALLIED_WITH_FACTION_TO_FACTION',
  ENEMY_OF_FACTION_TO_FACTION = 'ENEMY_OF_FACTION_TO_FACTION',
  SUBGROUP_OF = 'SUBGROUP_OF',
  TRADE_AGREEMENT_WITH = 'TRADE_AGREEMENT_WITH',
  // Faction to Event
  PARTICIPATED_IN_EVENT_BY_FACTION = 'PARTICIPATED_IN_EVENT_BY_FACTION',
  INITIATED_EVENT_BY_FACTION = 'INITIATED_EVENT_BY_FACTION',
  AFFECTED_BY_EVENT_AS_FACTION = 'AFFECTED_BY_EVENT_AS_FACTION',
  // Faction to Concept
  ADHERES_TO_CONCEPT_BY_FACTION = 'ADHERES_TO_CONCEPT_BY_FACTION',
  PROMOTES_CONCEPT_BY_FACTION = 'PROMOTES_CONCEPT_BY_FACTION',
  BANNED_CONCEPT_BY_FACTION = 'BANNED_CONCEPT_BY_FACTION',

  /* --- Location Relationships --- */
  // Location to Location
  LOCATED_IN = 'LOCATED_IN',
  ADJACENT_TO = 'ADJACENT_TO',
  CONTAINS_LOCATION = 'CONTAINS_LOCATION',
  CONNECTED_TO_LOCATION = 'CONNECTED_TO_LOCATION',
  // Location to Event
  SITE_OF_EVENT = 'SITE_OF_EVENT',
  // Location to Faction
  CONTROLLED_BY_FACTION = 'CONTROLLED_BY_FACTION',
  HEADQUARTERS_OF_FACTION = 'HEADQUARTERS_OF_FACTION',
  TERRITORY_OF_FACTION = 'TERRITORY_OF_FACTION',

  /* --- Item Relationships --- */
  // Item to Location
  FOUND_IN_LOCATION = 'FOUND_IN_LOCATION',
  STORED_AT_LOCATION = 'STORED_AT_LOCATION',
  ORIGINATES_FROM_LOCATION = 'ORIGINATES_FROM_LOCATION',
  // Item to Event
  USED_IN_EVENT = 'USED_IN_EVENT',
  CREATED_DURING_EVENT_AS_ITEM = 'CREATED_DURING_EVENT_AS_ITEM',
  DESTROYED_DURING_EVENT_AS_ITEM = 'DESTROYED_DURING_EVENT_AS_ITEM',
  KEY_OBJECT_IN_EVENT = 'KEY_OBJECT_IN_EVENT',
  // Item to Concept
  EMBODIES_CONCEPT_AS_ITEM = 'EMBODIES_CONCEPT_AS_ITEM',
  POWERED_BY_CONCEPT_AS_ITEM = 'POWERED_BY_CONCEPT_AS_ITEM',

  /* --- Event Relationships --- */
  // Event to Event
  PRECEDES_EVENT = 'PRECEDES_EVENT',
  FOLLOWS_EVENT = 'FOLLOWS_EVENT',
  CAUSED_BY_EVENT_AS_EVENT = 'CAUSED_BY_EVENT_AS_EVENT',
  PART_OF_EVENT = 'PART_OF_EVENT',
  // Event to Concept
  DEMONSTRATES_CONCEPT_AS_EVENT = 'DEMONSTRATES_CONCEPT_AS_EVENT',
  LED_TO_CREATION_OF_CONCEPT_BY_EVENT = 'LED_TO_CREATION_OF_CONCEPT_BY_EVENT',
  // Event to DateEntry (Era)
  OCCURRED_DURING_ERA = 'OCCURRED_DURING_ERA',

  /* --- Concept Relationships --- */
  // Concept to Concept
  RELATED_TO_CONCEPT = 'RELATED_TO_CONCEPT',
  DERIVED_FROM_CONCEPT = 'DERIVED_FROM_CONCEPT',
  OPPOSES_CONCEPT = 'OPPOSES_CONCEPT',
  PREREQUISITE_FOR_CONCEPT = 'PREREQUISITE_FOR_CONCEPT',
  // Concept to Faction
  CREATED_BY_FACTION_AS_CONCEPT = 'CREATED_BY_FACTION_AS_CONCEPT',

  /* --- DateEntry (Era/Period) Relationships --- */
  // DateEntry to DateEntry
  CONTAINS_PERIOD = 'CONTAINS_PERIOD',
  OVERLAPS_WITH_ERA = 'OVERLAPS_WITH_ERA',
  PRECEDES_ERA_AS_DATE = 'PRECEDES_ERA_AS_DATE',
  FOLLOWS_ERA_AS_DATE = 'FOLLOWS_ERA_AS_DATE',
}

export class RelationshipPropertiesDto {
  /* --- Character to Faction --- */
  @IsString() @IsOptional() @MaxLength(100) role?: string; // For MEMBER_OF, PARTICIPATED_IN
  @IsDateString() @IsOptional() joinDate?: string; // For MEMBER_OF
  @IsString() @IsOptional() @MaxLength(100) rank?: string; // For MEMBER_OF
  @IsString() @IsOptional() @MaxLength(100) status?: string; // For ALLIED_WITH_FACTION
  @IsDateString() @IsOptional() since?: string; // For ALLIED_WITH_FACTION, RESIDES_IN
  @IsString() @IsOptional() @MaxLength(500) reason?: string; // For ENEMY_OF_FACTION, SEEKS_ITEM, VISITED
  @IsString() @IsOptional() @MaxLength(100) intensity?: string; // For ENEMY_OF_FACTION
  @IsDateString() @IsOptional() dateFounded?: string; // For FOUNDED_FACTION
  @IsString() @IsOptional() @MaxLength(1000) foundingPrinciples?: string; // For FOUNDED_FACTION
  @IsDateString() @IsOptional() firstEncounterDate?: string; // For ENEMY_OF_FACTION

  /* --- Character to Character --- */
  @IsDateString() @IsOptional() firstMet?: string; // For KNOWS
  @IsString() @IsOptional() @MaxLength(100) acquaintanceLevel?: string; // For KNOWS
  @IsString() @IsOptional() @MaxLength(500) opinion?: string; // For KNOWS
  @IsString() @IsOptional() @MaxLength(100) allianceType?: string; // For ALLY_OF_CHARACTER
  @IsString() @IsOptional() @MaxLength(100) strength?: string; // For ALLY_OF_CHARACTER
  @IsString() @IsOptional() @MaxLength(100) type?: string; // For FAMILY_RELATIONSHIP_IS, PROFESSIONAL_RELATIONSHIP_IS, CONNECTED_TO_LOCATION
  @IsBoolean() @IsOptional() biological?: boolean; // For FAMILY_RELATIONSHIP_IS
  @IsString() @IsOptional() @MaxLength(500) details?: string; // For PROFESSIONAL_RELATIONSHIP_IS
  @IsDateString() @IsOptional() startDate?: string; // For PROFESSIONAL_RELATIONSHIP_IS
  @IsDateString() @IsOptional() endDate?: string; // For PROFESSIONAL_RELATIONSHIP_IS, RULES_OVER_LOCATION

  /* --- Character to Location --- */
  @IsDateString() @IsOptional() dateOfBirth?: string; // For BORN_IN
  @IsDateString() @IsOptional() dateOfDeath?: string; // For DIED_IN
  @IsString() @IsOptional() @MaxLength(255) causeOfDeath?: string; // For DIED_IN
  @IsBoolean() @IsOptional() isPrimaryResidence?: boolean; // For RESIDES_IN
  @IsString() @IsOptional() @MaxLength(500) addressDetails?: string; // For RESIDES_IN
  @IsDateString() @IsOptional() dateVisited?: string; // For VISITED
  @IsString() @IsOptional() @MaxLength(100) duration?: string; // For VISITED, STUDIED_CONCEPT
  @IsString() @IsOptional() @MaxLength(100) title?: string; // For RULES_OVER_LOCATION
  @IsDateString() @IsOptional() reignStart?: string; // For RULES_OVER_LOCATION

  /* --- Character to Event --- */
  @IsString() @IsOptional() @MaxLength(100) roleInEvent?: string; // For PARTICIPATED_IN
  @IsString() @IsOptional() @MaxLength(500) significanceToCharacter?: string; // For PARTICIPATED_IN
  @IsString() @IsOptional() @MaxLength(500) outcomeForCharacter?: string; // For PARTICIPATED_IN
  @IsDateString() @IsOptional() dateWitnessed?: string; // For WITNESSED
  @IsString() @IsOptional() @MaxLength(500) perspective?: string; // For WITNESSED
  @IsString() @IsOptional() @MaxLength(255) methodOrMeans?: string; // For CAUSED_EVENT
  @IsString() @IsOptional() @MaxLength(255) intent?: string; // For CAUSED_EVENT
  @IsString() @IsOptional() @MaxLength(255) natureOfVictimization?: string; // For VICTIM_OF_EVENT
  @IsString() @IsOptional() @MaxLength(500) impact?: string; // For VICTIM_OF_EVENT

  /* --- Character to Item --- */
  @IsDateString() @IsOptional() dateAcquired?: string; // For OWNS_ITEM
  @IsString() @IsOptional() @MaxLength(255) acquisitionMethod?: string; // For OWNS_ITEM
  @IsBoolean() @IsOptional() isEquipped?: boolean; // For OWNS_ITEM
  @IsBoolean() @IsOptional() isPrimary?: boolean; // For WIELDS_ITEM (e.g. primary weapon)
  @IsDateString() @IsOptional() dateCreated?: string; // For CREATED_ITEM
  @IsString() @IsOptional() @MaxLength(255) craftingMethod?: string; // For CREATED_ITEM
  @IsString() @IsOptional() @MaxLength(100) priority?: string; // For SEEKS_ITEM
  @IsString() @IsOptional() @MaxLength(255) lastKnownLocation?: string; // For SEEKS_ITEM

  /* --- Character to Concept --- */
  @IsString() @IsOptional() @MaxLength(100) convictionLevel?: string; // For BELIEVES_IN
  @IsDateString() @IsOptional() dateAdoptedBelief?: string; // For BELIEVES_IN
  @IsString() @IsOptional() @MaxLength(100) masteryLevel?: string; // For STUDIED_CONCEPT
  @IsString() @IsOptional() @MaxLength(255) institution?: string; // For STUDIED_CONCEPT
  @IsDateString() @IsOptional() dateMastered?: string; // For MASTERED_CONCEPT
  @IsString() @IsOptional() @MaxLength(500) application?: string; // For MASTERED_CONCEPT

  /* --- Location to Location --- */
  @IsString() @IsOptional() @MaxLength(100) transitTime?: string; // For CONNECTED_TO_LOCATION

  /* --- Generic --- */
  @IsString() @IsOptional() @MaxLength(500) significance?: string; // Reused for PARTICIPATED_IN etc.
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
