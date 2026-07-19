import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsArray,
  IsUrl,
  Matches,
  Length,
  IsIn,
} from 'class-validator';
import { ActivityType, ActivityStatus, ActivityPriority } from '../entities/activity.entity';

const ACTIVITY_TYPES: ActivityType[] = [
  'flight','train','bus','transfer','accommodation',
  'sightseeing','food','shopping','document','reminder','free','other',
];
const STATUSES: ActivityStatus[] = ['pending', 'confirmed', 'reserved', 'cancelled'];
const PRIORITIES: ActivityPriority[] = ['low', 'medium', 'high'];

export class CreateActivityDto {
  @IsString()
  title: string;

  @IsEnum(ACTIVITY_TYPES)
  type: ActivityType;

  @IsDateString()
  date: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  startTime?: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/)
  endTime?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  countries?: string[];

  @IsOptional()
  @IsString()
  originCountry?: string;

  @IsOptional()
  @IsString()
  destinationCountry?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(STATUSES)
  status?: ActivityStatus;

  @IsOptional()
  @IsEnum(PRIORITIES)
  priority?: ActivityPriority;

  @IsOptional()
  @IsUrl()
  link?: string;

  @IsOptional() @Matches(/^\d+(?:\.\d{1,3})?$/) price?: string;
  @IsOptional() @Length(3, 3) priceCurrency?: string;
  @IsOptional() @IsIn(['per_person', 'total']) priceType?: 'per_person' | 'total';
  @IsOptional() @IsIn(['estimated', 'reserved', 'partial', 'paid']) financialStatus?: 'estimated' | 'reserved' | 'partial' | 'paid';
  @IsOptional() @IsArray() @IsString({ each: true }) financialParticipantUserIds?: string[];
  @IsOptional() @IsString() financialPayerUserId?: string;
  @IsOptional() @IsDateString() paidAt?: string;
  @IsOptional() @IsUrl() paymentReferenceUrl?: string;
}
