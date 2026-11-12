import { IsString, IsNotEmpty, IsOptional, IsDateString, MaxLength, IsInt, Min, Max } from 'class-validator';

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
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  weeklyCapacityPoints?: number | null;
}
