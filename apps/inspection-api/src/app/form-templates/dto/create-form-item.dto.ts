import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { FormItemType } from '../entities/form-item.entity';

export class CreateFormItemDto {
  @IsEnum(FormItemType)
  type!: FormItemType;

  @ValidateIf((value: CreateFormItemDto) => value.type === FormItemType.TASK)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ValidateIf((value: CreateFormItemDto) => value.type === FormItemType.CONCEPT)
  @IsUUID()
  conceptId?: string | null;

  @IsBoolean()
  required!: boolean;
}
