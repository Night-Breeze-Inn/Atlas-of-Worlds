// backend/src/items/entities/item.entity.ts
import { DateTime as Neo4jDateTime } from 'neo4j-driver';

export enum ItemType {
  WEAPON = 'Weapon',
  ARMOR = 'Armor',
  ARTIFACT = 'Artifact',
  CONSUMABLE = 'Consumable',
  TOOL = 'Tool',
  MATERIAL = 'Material',
  DOCUMENT = 'Document',
  KEY_ITEM = 'Key Item',
  TRINKET = 'Trinket',
  OTHER = 'Other',
}

export enum ItemRarity {
  COMMON = 'Common',
  UNCOMMON = 'Uncommon',
  RARE = 'Rare',
  EPIC = 'Epic',
  LEGENDARY = 'Legendary',
  ARTIFACT_RARITY = 'Artifact',
  UNIQUE = 'Unique',
  OTHER = 'Other',
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  type?: ItemType;
  rarity?: ItemRarity;
  properties?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemNodeProperties {
  id: string;
  name: string;
  description?: string;
  type?: ItemType;
  rarity?: ItemRarity;
  propertiesString?: string;
  createdAt: Neo4jDateTime | string;
  updatedAt: Neo4jDateTime | string;
}
