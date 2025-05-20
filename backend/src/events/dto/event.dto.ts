export class EventDto {
  id: string;
  name: string;
  description?: string;
  eventDate?: string;
  significance?: string;
  worldId: string;
  createdAt: Date;
  updatedAt: Date;
}
