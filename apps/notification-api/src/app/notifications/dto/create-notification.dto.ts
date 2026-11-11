import {
  IsISO8601,
  IsObject,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { NotificationScopeDto } from './notification-scope.dto';

export class CreateNotificationDto extends NotificationScopeDto {
  @IsString()
  @MaxLength(200)
  @Matches(/\S/)
  title!: string;

  @IsString()
  @MaxLength(10000)
  @Matches(/\S/)
  body!: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9][a-z0-9._-]*$/)
  type?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsObject()
  metadata?: Record<string, unknown>;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(200)
  @Matches(/^[\x21-\x7e]+$/)
  eventKey?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsISO8601({ strict: true, strictSeparator: true })
  occurredAt?: string;
}
