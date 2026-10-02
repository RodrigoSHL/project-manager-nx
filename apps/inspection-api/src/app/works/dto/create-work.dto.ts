import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { WorkStatus } from '../entities/work.entity';

export class CreateWorkDto {
  @IsUUID()
  workTypeId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsDateString({ strict: true })
  executionDate!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  responsible!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  company?: string;

  @IsEnum(WorkStatus)
  status: WorkStatus = WorkStatus.DRAFT;

  @IsOptional()
  @IsString()
  notes?: string;
}
