import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ConceptResponseValueDto {
  @IsUUID()
  formItemId!: string;

  @IsOptional()
  @IsNumber()
  valueNumber?: number;

  @IsOptional()
  @IsString()
  valueText?: string;

  @IsOptional()
  @IsUUID()
  selectedOptionId?: string;
}

export class TaskCompletionValueDto {
  @IsUUID()
  formItemId!: string;

  @IsBoolean()
  completed!: boolean;
}

export class SaveWorkResponsesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConceptResponseValueDto)
  responses: ConceptResponseValueDto[] = [];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskCompletionValueDto)
  taskCompletions: TaskCompletionValueDto[] = [];
}
