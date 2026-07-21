import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsHexColor, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { LuggageType } from '../entities/luggage.entity';

export class LuggageDimensionsDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  height: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  width: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  depth: number;
}

export class CreateLuggageDto {
  @IsString()
  name: string;

  @IsEnum(LuggageType)
  type: LuggageType;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  capacityLiters?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  emptyWeight?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  maxWeight?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => LuggageDimensionsDto)
  dimensions?: LuggageDimensionsDto;

  @IsOptional()
  @IsBoolean()
  cabinCompatible?: boolean;

  @IsOptional()
  @IsBoolean()
  personalItemCompatible?: boolean;

  @IsOptional()
  @IsBoolean()
  checkedBaggage?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLuggageDto extends PartialType(CreateLuggageDto) {
  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}
