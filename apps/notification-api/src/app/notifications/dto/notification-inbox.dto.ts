import { OmitType } from '@nestjs/mapped-types';
import {
  ArrayMaxSize,
  IsArray,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ListNotificationsDto } from './list-notifications.dto';

export class NotificationInboxDto extends OmitType(ListNotificationsDto, [
  'projectId',
] as const) {
  @IsArray()
  @ArrayMaxSize(5000)
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  @Matches(/\S/, { each: true })
  projectIds!: string[];
}
