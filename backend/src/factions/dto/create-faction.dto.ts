import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
} from 'class-validator';
import { FactionType } from '../entities/faction.entity';

export class CreateFactionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsIn(Object.values(FactionType))
  type?: FactionType;

  @IsString()
  @IsOptional()
  ideology?: string;

  @IsUUID()
  @IsNotEmpty()
  worldId: string;
}
