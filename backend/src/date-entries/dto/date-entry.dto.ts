export class DateEntryDto {
  id: string;
  name: string;
  description?: string;
  startDate?: number;
  endDate?: number;
  era?: string;
  worldId: string;
  createdAt: Date;
  updatedAt: Date;
}
