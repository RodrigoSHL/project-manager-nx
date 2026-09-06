import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AssetStatus } from '../entities/asset.entity';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  type!: string;

  @IsOptional()
  @IsUUID('all')
  parentId?: string | null;

  @IsEnum(AssetStatus)
  status!: AssetStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;
}
