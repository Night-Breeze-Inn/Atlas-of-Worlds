import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import type { CreateWorldDto as ICreateWorldDto } from '@atlas-of-worlds/types';

export class CreateWorldDto implements ICreateWorldDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  defaultMoneySystem?: string;
}
