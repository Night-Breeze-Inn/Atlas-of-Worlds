import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateLocationDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  type?: string;
}
