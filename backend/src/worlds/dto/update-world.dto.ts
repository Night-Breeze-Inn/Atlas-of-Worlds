import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateWorldDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  defaultMoneySystem?: string;
}
