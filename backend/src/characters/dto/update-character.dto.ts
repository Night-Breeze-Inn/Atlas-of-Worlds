import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsArray,
  IsIn,
} from 'class-validator';
import { CharacterRole, CharacterStatus } from '../entities/character.entity';

export class UpdateCharacterDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

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
}
