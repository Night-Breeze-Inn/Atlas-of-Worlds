import { DateTime as Neo4jDateTime } from 'neo4j-driver';

export enum FactionType {
  COUNTRY = 'Country',
  GUILD = 'Guild',
  CRIMINAL_SYNDICATE = 'Criminal Syndicate',
  RELIGIOUS_ORDER = 'Religious Order',
  CORPORATION = 'Corporation',
  TRIBE = 'Tribe',
  OTHER = 'Other',
}

export interface Faction {
  id: string; // UUID
  name: string;
  description?: string; // Rich text
  type?: FactionType;
  ideology?: string; // Text
  // leaderId will be via relationship
  createdAt: Date;
  updatedAt: Date;
}

export interface FactionNodeProperties {
  id: string;
  name: string;
  description?: string;
  type?: FactionType;
  ideology?: string;
  createdAt: Neo4jDateTime | string;
  updatedAt: Neo4jDateTime | string;
}
