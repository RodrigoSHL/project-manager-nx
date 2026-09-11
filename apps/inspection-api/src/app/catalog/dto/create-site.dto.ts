import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { SiteType } from '../entities/site.entity';

export class CreateSiteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  @Matches(/^[A-Z0-9]+(?:_[A-Z0-9]+)*$/)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @IsEnum(SiteType)
  type!: SiteType;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
