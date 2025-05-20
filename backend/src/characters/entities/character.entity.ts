import { DateTime as Neo4jDateTime } from 'neo4j-driver';

export enum CharacterStatus {
  ALIVE = 'Alive',
  DECEASED = 'Deceased',
  UNKNOWN = 'Unknown',
  OTHER = 'Other',
}

export enum CharacterRole {
  PLAYER_CHARACTER = 'Player Character',
  NPC = 'NPC',
  MONSTER = 'Monster',
  DEITY = 'Deity',
  OTHER = 'Other',
}

export interface Character {
  id: string;
  name: string;
  description?: string;
  aliases?: string[];
  appearance?: string;
  status?: CharacterStatus;
  role?: CharacterRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface CharacterNodeProperties {
  id: string;
  name: string;
  description?: string;
  aliases?: string[];
  appearance?: string;
  status?: CharacterStatus;
  role?: CharacterRole;
  createdAt: Neo4jDateTime | string;
  updatedAt: Neo4jDateTime | string;
}
