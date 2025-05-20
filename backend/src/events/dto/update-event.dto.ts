import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsDateString,
} from 'class-validator';

export class UpdateEventDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  eventDate?: string;

  @IsString()
  @IsOptional()
  significance?: string;
}
