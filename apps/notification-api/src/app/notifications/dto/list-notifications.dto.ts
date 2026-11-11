import { Type } from 'class-transformer';
import { IsIn, IsInt, Max, Min } from 'class-validator';
import { NotificationScopeDto } from './notification-scope.dto';

export class ListNotificationsDto extends NotificationScopeDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsIn(['all', 'read', 'unread'])
  status: 'all' | 'read' | 'unread' = 'all';
}
