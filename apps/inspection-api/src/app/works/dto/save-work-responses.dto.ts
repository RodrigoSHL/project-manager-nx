import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
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

export class WorkItemAnnotationValueDto {
  @IsUUID()
  formItemId!: string;

  @IsString()
  @MaxLength(2000)
  comment!: string;
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkItemAnnotationValueDto)
  annotations: WorkItemAnnotationValueDto[] = [];
}
