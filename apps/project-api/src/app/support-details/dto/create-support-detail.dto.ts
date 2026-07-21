import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSupportDetailDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  clientContact?: string;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @IsOptional()
  ufValue?: number;

  @IsBoolean()
  @IsOptional()
  isBillable?: boolean;

  @IsDateString()
  @IsOptional()
  billedAt?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  invoiceRef?: string;

  @IsDateString()
  @IsOptional()
  slaDeadline?: string;

  @IsDateString()
  @IsOptional()
  resolvedAt?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
