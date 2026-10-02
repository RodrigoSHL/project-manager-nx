import { IsNotEmpty, IsString, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class CommentBodyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  body: string;
}

export class CreateCommentBodyDto extends CommentBodyDto {
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}
