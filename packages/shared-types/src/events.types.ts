export interface EventDto {
    id: string;
    name: string;
    description?: string;
    eventDate?: string; // Can be full ISO DateTime string or just Date string (YYYY-MM-DD)
    significance?: string;
    worldId: string;
    createdAt: string; // ISO Date String
    updatedAt: string; // ISO Date String
  }
  
  export interface CreateEventDto {
    name: string;
    description?: string;
    eventDate?: string;
    significance?: string;
    worldId: string;
  }
  
  export interface UpdateEventDto {
    name?: string;
    description?: string;
    eventDate?: string;
    significance?: string;
  }