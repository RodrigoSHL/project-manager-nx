import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ListFilesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  application?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ownerType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ownerId?: string;
}
