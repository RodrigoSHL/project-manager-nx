import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9][a-z0-9_-]*$/i)
  application!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ownerType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ownerId?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  })
  @IsObject()
  metadata?: Record<string, unknown>;
}
