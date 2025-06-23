export enum FactionType {
    COUNTRY = 'Country',
    GUILD = 'Guild',
    CRIMINAL_SYNDICATE = 'Criminal Syndicate',
    RELIGIOUS_ORDER = 'Religious Order',
    CORPORATION = 'Corporation',
    TRIBE = 'Tribe',
    OTHER = 'Other',
  }
  
  export interface FactionDto {
    id: string;
    name: string;
    description?: string;
    type?: FactionType;
    ideology?: string;
    worldId: string;
    createdAt: string; // ISO Date String
    updatedAt: string; // ISO Date String
  }
  
  export interface CreateFactionDto {
    name: string;
    description?: string;
    type?: FactionType;
    ideology?: string;
    worldId: string;
  }
  
  export interface UpdateFactionDto {
    name?: string;
    description?: string;
    type?: FactionType;
    ideology?: string;
  }