import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  IsIn,
} from 'class-validator';
import { CharacterRole, CharacterStatus } from '../entities/character.entity';

export class CreateCharacterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  aliases?: string[];

  @IsString()
  @IsOptional()
  appearance?: string;

  @IsString()
  @IsOptional()
  @IsIn(Object.values(CharacterStatus))
  status?: CharacterStatus;

  @IsString()
  @IsOptional()
  @IsIn(Object.values(CharacterRole))
  role?: CharacterRole;

  @IsUUID()
  @IsNotEmpty()
  worldId: string;
}
