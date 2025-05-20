import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateConceptDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;
}
