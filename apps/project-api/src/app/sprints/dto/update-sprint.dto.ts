import { IsString, IsOptional, IsDateString, MaxLength, IsInt, Min, Max } from 'class-validator';

export class UpdateSprintDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  goal?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string | null;

  @IsDateString()
  @IsOptional()
  endDate?: string | null;
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  weeklyCapacityPoints?: number | null;
}
