import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';

export class UpdateLabelDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a valid hex color (e.g. #3B82F6)' })
  color?: string;
}
