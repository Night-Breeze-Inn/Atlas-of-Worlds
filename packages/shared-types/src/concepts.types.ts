export interface ConceptDto {
    id: string;
    name: string;
    description?: string;
    category?: string;
    worldId: string;
    createdAt: string; // ISO Date String
    updatedAt: string; // ISO Date String
  }
  
  export interface CreateConceptDto {
    name: string;
    description?: string;
    category?: string;
    worldId: string;
  }
  
  export interface UpdateConceptDto {
    name?: string;
    description?: string;
    category?: string;
  }