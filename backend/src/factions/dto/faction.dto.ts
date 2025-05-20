import { FactionType } from '../entities/faction.entity';

export class FactionDto {
  id: string;
  name: string;
  description?: string;
  type?: FactionType;
  ideology?: string;
  worldId: string;
  createdAt: Date;
  updatedAt: Date;
}
