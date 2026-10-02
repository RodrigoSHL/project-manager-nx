import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateSeverityLevelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @IsInt()
  @Min(0)
  order!: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateSeverityLevelDto extends PartialType(
  CreateSeverityLevelDto
) {}
