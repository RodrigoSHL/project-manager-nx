import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
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

  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  measuredAt?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  measuredAtTime?: string | null;
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

  @IsOptional()
  @IsBoolean()
  isFinding?: boolean;
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
