import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

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
}
