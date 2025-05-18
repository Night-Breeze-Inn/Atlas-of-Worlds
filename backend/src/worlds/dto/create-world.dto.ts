import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateWorldDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  defaultMoneySystem?: string;

  @IsUUID()
  @IsNotEmpty()
  ownerId: string;
}
