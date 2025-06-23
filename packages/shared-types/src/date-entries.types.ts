export interface DateEntryDto {
    id: string;
    name: string;
    description?: string;
    startDate?: number; // Representing year or similar simple numeric date
    endDate?: number;
    era?: string;
    worldId: string;
    createdAt: string; // ISO Date String
    updatedAt: string; // ISO Date String
  }
  
  export interface CreateDateEntryDto {
    name: string;
    description?: string;
    startDate?: number;
    endDate?: number;
    era?: string;
    worldId: string;
  }
  
  export interface UpdateDateEntryDto {
    name?: string;
    description?: string;
    startDate?: number;
    endDate?: number;
    era?: string;
  }