import { ArrayMaxSize, ArrayUnique, IsArray, IsString, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class CommentBodyDto {
  @IsString()
  @MaxLength(5000)
  body: string;
}

export class CreateCommentBodyDto extends CommentBodyDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  attachmentIds?: string[];

  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}
