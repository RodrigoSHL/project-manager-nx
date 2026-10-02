import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class AnalyticsFiltersDto {
  @IsOptional() @IsUUID() siteId?: string;
  @IsOptional() @IsUUID() workTypeId?: string;
  @IsOptional() @IsUUID() assetTypeId?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) from?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) to?: string;
}

export class FindingsFiltersDto extends AnalyticsFiltersDto {
  @IsOptional() @IsUUID() severityId?: string;
  @IsOptional() @IsUUID() assetId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit = 10;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100000) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 25;
}

export class MeasurementsFiltersDto extends AnalyticsFiltersDto {
  @IsUUID() conceptId!: string;
  @IsOptional() @IsUUID() assetId?: string;
  @IsOptional() @IsString() assetIds?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5000) limit = 1000;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100000) page = 1;
}

export class HistoryFiltersDto extends AnalyticsFiltersDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100000) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 25;
}

export enum ActivityGrouping {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export class ActivityFiltersDto extends AnalyticsFiltersDto {
  @IsOptional() @IsEnum(ActivityGrouping) groupBy: ActivityGrouping =
    ActivityGrouping.MONTH;
}

export class ConceptsFiltersDto extends AnalyticsFiltersDto {}
