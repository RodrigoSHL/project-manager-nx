import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  NotContains,
} from 'class-validator';

export class JiraCommentMentionDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1)
  @IsEmail({}, { each: true })
  to!: string[];

  @IsString()
  @Matches(/\S/)
  @MaxLength(255)
  recipientName!: string;

  @IsString()
  @Matches(/\S/)
  @MaxLength(255)
  @NotContains('\r')
  @NotContains('\n')
  authorName!: string;

  @IsString()
  @Matches(/\S/)
  @MaxLength(255)
  projectName!: string;

  @IsString()
  @Matches(/^[A-Za-z0-9_-]{1,20}$/)
  @NotContains('\r')
  @NotContains('\n')
  ticketKey!: string;

  @IsString()
  @Matches(/\S/)
  @MaxLength(500)
  ticketTitle!: string;

  @IsString()
  @Matches(/\S/)
  @MaxLength(6000)
  commentText!: string;

  @IsUUID() workspaceId!: string;
  @IsUUID() projectId!: string;
  @IsUUID() ticketId!: string;
  @IsUUID() commentId!: string;
}
