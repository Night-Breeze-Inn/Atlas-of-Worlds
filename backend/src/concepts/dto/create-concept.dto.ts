import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateConceptDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsUUID()
  @IsNotEmpty()
  worldId: string;
}
