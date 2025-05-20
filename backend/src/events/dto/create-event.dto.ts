import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  eventDate?: string;

  @IsString()
  @IsOptional()
  significance?: string;

  @IsUUID()
  @IsNotEmpty()
  worldId: string;
}
