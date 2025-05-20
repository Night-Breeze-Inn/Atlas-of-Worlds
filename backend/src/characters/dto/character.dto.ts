import { CharacterRole, CharacterStatus } from '../entities/character.entity';

export class CharacterDto {
  id: string;
  name: string;
  description?: string;
  aliases?: string[];
  appearance?: string;
  status?: CharacterStatus;
  role?: CharacterRole;
  worldId: string;
  createdAt: Date;
  updatedAt: Date;
}
