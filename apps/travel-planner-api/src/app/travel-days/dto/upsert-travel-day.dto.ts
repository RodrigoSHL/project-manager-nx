import { IsDateString, IsArray, IsString, IsOptional } from 'class-validator';

export class UpsertTravelDayDto {
  @IsDateString()
  date: string;

  @IsArray()
  @IsString({ each: true })
  countries: string[];

  @IsOptional()
  @IsString()
  mainCity?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
