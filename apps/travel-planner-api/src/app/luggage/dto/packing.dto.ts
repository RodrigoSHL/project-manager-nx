import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { BaggagePolicy, PackMoment, PackingCategory, PackingItemStatus, PackingPriority } from '../entities/packing-item.entity';
import { LuggageOccupancy, TripLuggageStatus } from '../entities/trip-luggage.entity';

export class AddTripLuggageDto {
  @IsUUID()
  luggageId: string;
}

export class UpdateTripLuggageDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  actualWeight?: number;

  @IsOptional()
  @IsEnum(LuggageOccupancy)
  occupancyLevel?: LuggageOccupancy;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  maxWeightOverride?: number;

  @IsOptional()
  @IsEnum(TripLuggageStatus)
  status?: TripLuggageStatus;
}

export class CreatePackingItemDto {
  @IsString()
  name: string;

  @IsEnum(PackingCategory)
  category: PackingCategory;

  @IsOptional()
  @IsUUID()
  luggageId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  quantity?: number;

  @IsOptional()
  @IsBoolean()
  haveIt?: boolean;

  @IsOptional()
  @IsBoolean()
  packed?: boolean;

  @IsOptional()
  @IsBoolean()
  purchaseRequired?: boolean;

  @IsOptional()
  @IsEnum(PackingItemStatus)
  status?: PackingItemStatus;

  @IsOptional()
  @IsEnum(PackingPriority)
  priority?: PackingPriority;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedWeight?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  actualWeight?: number;

  @IsOptional()
  @IsEnum(PackMoment)
  packMoment?: PackMoment;

  @IsOptional()
  @IsBoolean()
  shared?: boolean;

  @IsOptional()
  @IsBoolean()
  private?: boolean;

  @IsOptional()
  @IsString()
  responsibleUserId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(BaggagePolicy)
  cabinPolicy?: BaggagePolicy;

  @IsOptional()
  @IsEnum(BaggagePolicy)
  checkedPolicy?: BaggagePolicy;
}

export class UpdatePackingItemDto extends CreatePackingItemDto {
  @IsOptional()
  name: string;

  @IsOptional()
  category: PackingCategory;
}

export enum PackingClimate {
  HOT = 'hot',
  MILD = 'mild',
  COLD = 'cold',
  RAINY = 'rainy',
  SNOW = 'snow',
  MIXED = 'mixed',
  UNKNOWN = 'unknown',
}

export enum PackingTravelStyle {
  MINIMAL = 'minimal',
  BALANCED = 'balanced',
  PREPARED = 'prepared',
}

export enum PackingActivity {
  CITY = 'city',
  BEACH = 'beach',
  HIKING = 'hiking',
  TRAINING = 'training',
  RUNNING = 'running',
  FORMAL = 'formal',
  WORK = 'work',
  SNOW = 'snow',
  CAMPING = 'camping',
  PHOTOGRAPHY = 'photography',
  NIGHTLIFE = 'nightlife',
  DRIVING = 'driving',
}

export class GeneratePackingListDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  customDays?: number;

  @IsEnum(PackingClimate)
  climate: PackingClimate;

  @IsArray()
  @ArrayUnique()
  @IsEnum(PackingActivity, { each: true })
  activities: PackingActivity[];

  @IsBoolean()
  laundryAccess: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  laundryEveryDays?: number;

  @IsEnum(PackingTravelStyle)
  style: PackingTravelStyle;

  @IsOptional()
  @IsBoolean()
  needsMedication?: boolean;

  @IsOptional()
  @IsBoolean()
  carriesLaptop?: boolean;

  @IsOptional()
  @IsBoolean()
  reserveShoppingSpace?: boolean;

  @IsOptional()
  @IsBoolean()
  replaceExisting?: boolean;
}
