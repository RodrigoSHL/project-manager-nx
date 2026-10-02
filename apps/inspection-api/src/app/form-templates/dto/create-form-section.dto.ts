import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFormSectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;
}
