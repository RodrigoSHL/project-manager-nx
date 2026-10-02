import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ConceptType } from '../entities/concept.entity';

export class ConceptOptionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  value!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  label!: string;

  @IsInt()
  @Min(1)
  order!: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsBoolean()
  generatesFinding?: boolean;

  @IsOptional()
  @IsUUID()
  suggestedSeverityId?: string | null;
}

export class CreateConceptDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsEnum(ConceptType)
  type!: ConceptType;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  unit?: string | null;

  @IsOptional()
  @IsNumber()
  minValue?: number | null;

  @IsOptional()
  @IsNumber()
  maxValue?: number | null;

  @IsOptional()
  @IsUUID()
  outOfRangeSeverityId?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConceptOptionDto)
  options!: ConceptOptionDto[];
}
