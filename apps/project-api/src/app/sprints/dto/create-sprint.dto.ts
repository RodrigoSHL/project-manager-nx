import { IsString, IsNotEmpty, IsOptional, IsDateString, IsUUID, MaxLength } from 'class-validator';

export class CreateSprintDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  goal?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
