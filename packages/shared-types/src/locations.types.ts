export interface LocationDto {
    id: string;
    name: string;
    description?: string;
    type?: string;
    worldId: string;
    createdAt: string; // ISO Date String
    updatedAt: string; // ISO Date String
  }
  
  export interface CreateLocationDto {
    name: string;
    description?: string;
    type?: string;
    worldId: string;
  }
  
  export interface UpdateLocationDto {
    name?: string;
    description?: string;
    type?: string;
  }