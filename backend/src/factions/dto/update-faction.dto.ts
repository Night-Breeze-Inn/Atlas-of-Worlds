import { IsString, IsOptional, IsNotEmpty, IsIn } from 'class-validator';
import { FactionType } from '../entities/faction.entity';

export class UpdateFactionDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

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
}
