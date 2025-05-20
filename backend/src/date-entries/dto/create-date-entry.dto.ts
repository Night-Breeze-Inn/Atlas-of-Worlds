import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';

export class CreateDateEntryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  @Max(99999)
  @IsOptional()
  startDate?: number;

  @IsInt()
  @Min(0)
  @Max(99999)
  @IsOptional()
  @ValidateIf((o: CreateDateEntryDto) => o.startDate !== undefined)
  endDate?: number;

  @IsString()
  @IsOptional()
  era?: string;

  @IsUUID()
  @IsNotEmpty()
  worldId: string;
}
