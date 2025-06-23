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
  
  export interface CharacterDto {
    id: string;
    name: string;
    description?: string;
    aliases?: string[];
    appearance?: string;
    status?: CharacterStatus;
    role?: CharacterRole;
    worldId: string;
    createdAt: string; // ISO Date String
    updatedAt: string; // ISO Date String
  }
  
  export interface CreateCharacterDto {
    name: string;
    description?: string;
    aliases?: string[];
    appearance?: string;
    status?: CharacterStatus;
    role?: CharacterRole;
    worldId: string;
  }
  
  export interface UpdateCharacterDto {
    name?: string;
    description?: string;
    aliases?: string[];
    appearance?: string;
    status?: CharacterStatus;
    role?: CharacterRole;
  }