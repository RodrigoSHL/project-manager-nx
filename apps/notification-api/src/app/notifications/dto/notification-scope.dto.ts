import { IsString, Matches, MaxLength } from 'class-validator';

export class NotificationScopeDto {
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9][a-z0-9-]*$/)
  application!: string;

  @IsString()
  @MaxLength(255)
  @Matches(/\S/)
  projectId!: string;

  @IsString()
  @MaxLength(255)
  @Matches(/\S/)
  recipientId!: string;
}
