import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';

export class UpdateDateEntryDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

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
  @ValidateIf(
    (o: UpdateDateEntryDto) =>
      o.startDate !== undefined || o.endDate !== undefined,
  )
  endDate?: number;

  @IsString()
  @IsOptional()
  era?: string;
}
