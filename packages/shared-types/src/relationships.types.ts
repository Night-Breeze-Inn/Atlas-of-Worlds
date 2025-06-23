export enum AllowedRelationshipTypes {
    /* --- Character Relationships --- */
    MEMBER_OF = 'MEMBER_OF',
    ALLIED_WITH_FACTION = 'ALLIED_WITH_FACTION',
    ENEMY_OF_FACTION = 'ENEMY_OF_FACTION',
    FOUNDED_FACTION = 'FOUNDED_FACTION',
    KNOWS = 'KNOWS',
    ALLY_OF_CHARACTER = 'ALLY_OF_CHARACTER',
    ENEMY_OF_CHARACTER = 'ENEMY_OF_CHARACTER',
    FAMILY_RELATIONSHIP_IS = 'FAMILY_RELATIONSHIP_IS',
    PROFESSIONAL_RELATIONSHIP_IS = 'PROFESSIONAL_RELATIONSHIP_IS',
    BORN_IN = 'BORN_IN',
    DIED_IN = 'DIED_IN',
    RESIDES_IN = 'RESIDES_IN',
    VISITED = 'VISITED',
    RULES_OVER_LOCATION = 'RULES_OVER_LOCATION',
    PARTICIPATED_IN = 'PARTICIPATED_IN',
    WITNESSED = 'WITNESSED',
    CAUSED_EVENT = 'CAUSED_EVENT',
    VICTIM_OF_EVENT = 'VICTIM_OF_EVENT',
    OWNS_ITEM = 'OWNS_ITEM',
    WIELDS_ITEM = 'WIELDS_ITEM',
    CREATED_ITEM = 'CREATED_ITEM',
    SEEKS_ITEM = 'SEEKS_ITEM',
    BELIEVES_IN = 'BELIEVES_IN',
    STUDIED_CONCEPT = 'STUDIED_CONCEPT',
    MASTERED_CONCEPT = 'MASTERED_CONCEPT',
  
    /* --- Faction Relationships --- */
    HAS_LEADER = 'HAS_LEADER',
    ALLIED_WITH_FACTION_TO_FACTION = 'ALLIED_WITH_FACTION_TO_FACTION',
    ENEMY_OF_FACTION_TO_FACTION = 'ENEMY_OF_FACTION_TO_FACTION',
    SUBGROUP_OF = 'SUBGROUP_OF',
    TRADE_AGREEMENT_WITH = 'TRADE_AGREEMENT_WITH',
    PARTICIPATED_IN_EVENT_BY_FACTION = 'PARTICIPATED_IN_EVENT_BY_FACTION',
    INITIated_EVENT_BY_FACTION = 'INITIATED_EVENT_BY_FACTION',
    AFFECTED_BY_EVENT_AS_FACTION = 'AFFECTED_BY_EVENT_AS_FACTION',
    ADHERES_TO_CONCEPT_BY_FACTION = 'ADHERES_TO_CONCEPT_BY_FACTION',
    PROMOTES_CONCEPT_BY_FACTION = 'PROMOTES_CONCEPT_BY_FACTION',
    BANNED_CONCEPT_BY_FACTION = 'BANNED_CONCEPT_BY_FACTION',
  
    /* --- Location Relationships --- */
    LOCATED_IN = 'LOCATED_IN',
    ADJACENT_TO = 'ADJACENT_TO',
    CONTAINS_LOCATION = 'CONTAINS_LOCATION',
    CONNECTED_TO_LOCATION = 'CONNECTED_TO_LOCATION',
    SITE_OF_EVENT = 'SITE_OF_EVENT',
    CONTROLLED_BY_FACTION = 'CONTROLLED_BY_FACTION',
    HEADQUARTERS_OF_FACTION = 'HEADQUARTERS_OF_FACTION',
    TERRITORY_OF_FACTION = 'TERRITORY_OF_FACTION',
  
    /* --- Item Relationships --- */
    FOUND_IN_LOCATION = 'FOUND_IN_LOCATION',
    STORED_AT_LOCATION = 'STORED_AT_LOCATION',
    ORIGINATES_FROM_LOCATION = 'ORIGINATES_FROM_LOCATION',
    USED_IN_EVENT = 'USED_IN_EVENT',
    CREATED_DURING_EVENT_AS_ITEM = 'CREATED_DURING_EVENT_AS_ITEM',
    DESTROYED_DURING_EVENT_AS_ITEM = 'DESTROYED_DURING_EVENT_AS_ITEM',
    KEY_OBJECT_IN_EVENT = 'KEY_OBJECT_IN_EVENT',
    EMBODIES_CONCEPT_AS_ITEM = 'EMBODIES_CONCEPT_AS_ITEM',
    POWERED_BY_CONCEPT_AS_ITEM = 'POWERED_BY_CONCEPT_AS_ITEM',
  
    /* --- Event Relationships --- */
    PRECEDES_EVENT = 'PRECEDES_EVENT',
    FOLLOWS_EVENT = 'FOLLOWS_EVENT',
    CAUSED_BY_EVENT_AS_EVENT = 'CAUSED_BY_EVENT_AS_EVENT',
    PART_OF_EVENT = 'PART_OF_EVENT',
    DEMONSTRATES_CONCEPT_AS_EVENT = 'DEMONSTRATES_CONCEPT_AS_EVENT',
    LED_TO_CREATION_OF_CONCEPT_BY_EVENT = 'LED_TO_CREATION_OF_CONCEPT_BY_EVENT',
    OCCURRED_DURING_ERA = 'OCCURRED_DURING_ERA',
  
    /* --- Concept Relationships --- */
    RELATED_TO_CONCEPT = 'RELATED_TO_CONCEPT',
    DERIVED_FROM_CONCEPT = 'DERIVED_FROM_CONCEPT',
    OPPOSES_CONCEPT = 'OPPOSES_CONCEPT',
    PREREQUISITE_FOR_CONCEPT = 'PREREQUISITE_FOR_CONCEPT',
    CREATED_BY_FACTION_AS_CONCEPT = 'CREATED_BY_FACTION_AS_CONCEPT',
  
    /* --- DateEntry (Era/Period) Relationships --- */
    CONTAINS_PERIOD = 'CONTAINS_PERIOD',
    OVERLAPS_WITH_ERA = 'OVERLAPS_WITH_ERA',
    PRECEDES_ERA_AS_DATE = 'PRECEDES_ERA_AS_DATE',
    FOLLOWS_ERA_AS_DATE = 'FOLLOWS_ERA_AS_DATE',
  }
  
  // This interface defines the possible properties a relationship can have.
  // It's a union of all possible fields. Specific relationship types will only use a subset.
  export interface RelationshipProperties {
    // Character to Faction
    role?: string;
    joinDate?: string; // ISO Date String
    rank?: string;
    status?: string;
    since?: string; // ISO Date String
    reason?: string;
    intensity?: string;
    dateFounded?: string; // ISO Date String
    foundingPrinciples?: string;
    firstEncounterDate?: string; // ISO Date String
  
    // Character to Character
    firstMet?: string; // ISO Date String
    acquaintanceLevel?: string;
    opinion?: string;
    allianceType?: string;
    strength?: string;
    type?: string; // For family, professional, connection types
    biological?: boolean;
    details?: string;
    startDate?: string; // ISO Date String
    endDate?: string; // ISO Date String
  
    // Character to Location
    dateOfBirth?: string; // ISO Date String
    dateOfDeath?: string; // ISO Date String
    causeOfDeath?: string;
    isPrimaryResidence?: boolean;
    addressDetails?: string;
    dateVisited?: string; // ISO Date String
    duration?: string;
    title?: string;
    reignStart?: string; // ISO Date String
  
    // Character to Event
    roleInEvent?: string;
    significanceToCharacter?: string;
    outcomeForCharacter?: string;
    dateWitnessed?: string; // ISO Date String
    perspective?: string;
    methodOrMeans?: string;
    intent?: string;
    natureOfVictimization?: string;
    impact?: string;
  
    // Character to Item
    dateAcquired?: string; // ISO Date String
    acquisitionMethod?: string;
    isEquipped?: boolean;
    isPrimary?: boolean;
    dateCreated?: string; // ISO Date String
    craftingMethod?: string;
    priority?: string;
    lastKnownLocation?: string;
  
    // Character to Concept
    convictionLevel?: string;
    dateAdoptedBelief?: string; // ISO Date String
    masteryLevel?: string;
    institution?: string;
    dateMastered?: string; // ISO Date String
    application?: string;
  
    // Location to Location
    transitTime?: string;
  
    // Generic (can be used by many, ensure 'significance' is distinct if needed)
    significance?: string;
  }
  
  export interface CreateRelationshipDto {
    relationshipType: AllowedRelationshipTypes;
    properties?: Partial<RelationshipProperties>; // Use Partial for optional properties
  }
  
  // For GETTING related nodes
  export interface GenericNodeData {
    id: string;
    labels: string[];
    properties: Record<string, any>;
  }
  
  export interface GenericRelationshipData {
    id: string; // Neo4j internal relationship ID (stringified)
    type: string; // The relationship type string
    properties: Partial<RelationshipProperties>;
  }
  
  export interface GenericRelatedNodeDto {
    node: GenericNodeData;
    relationship: GenericRelationshipData;
    direction: 'outgoing' | 'incoming';
  }
  
  
  // For specific related node queries (like character's factions)
  // TNode = The DTO type for the related node (e.g., FactionDto)
  // TRelProps = The specific properties for THIS relationship type (e.g., subset of RelationshipProperties)
  export interface RelatedNodeDto<TNode, TRelProps = Partial<RelationshipProperties>> {
    node: TNode;
    relationshipProperties: TRelProps;
    relationshipType: string; // This will be one of AllowedRelationshipTypes
    direction?: 'outgoing' | 'incoming';
  }