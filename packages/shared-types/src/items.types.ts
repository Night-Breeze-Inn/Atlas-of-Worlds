export enum ItemType {
    WEAPON = 'Weapon',
    ARMOR = 'Armor',
    ARTIFACT = 'Artifact',
    CONSUMABLE = 'Consumable',
    TOOL = 'Tool',
    MATERIAL = 'Material',
    DOCUMENT = 'Document',
    KEY_ITEM = 'Key Item',
    TRINKET = 'TrinkET', // Corrected typo from your original (TRINKET)
    OTHER = 'Other',
  }
  
  export enum ItemRarity {
    COMMON = 'Common',
    UNCOMMON = 'Uncommon',
    RARE = 'Rare',
    EPIC = 'Epic',
    LEGENDARY = 'Legendary',
    ARTIFACT_RARITY = 'Artifact', // Note: Same name as an ItemType, ensure distinction if needed
    UNIQUE = 'Unique',
    OTHER = 'Other',
  }
  
  export interface ItemDto {
    id: string;
    name: string;
    description?: string;
    type?: ItemType;
    rarity?: ItemRarity;
    properties?: Record<string, any>; // JSON object, frontend will receive it parsed
    worldId: string;
    createdAt: string; // ISO Date String
    updatedAt: string; // ISO Date String
  }
  
  export interface CreateItemDto {
    name: string;
    description?: string;
    type?: ItemType;
    rarity?: ItemRarity;
    properties?: Record<string, any>;
    worldId: string;
  }
  
  export interface UpdateItemDto {
    name?: string;
    description?: string;
    type?: ItemType;
    rarity?: ItemRarity;
    properties?: Record<string, any>;
  }