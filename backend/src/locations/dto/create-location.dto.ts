import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsUUID()
  @IsNotEmpty()
  worldId: string;
}
