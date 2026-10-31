import { ArrayMaxSize, ArrayUnique, IsArray, IsString, IsNotEmpty, IsUUID, IsOptional, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MaxLength(5000)
  body: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  attachmentIds?: string[];

  @IsUUID()
  @IsNotEmpty()
  authorId: string;

  @IsOptional()
  @IsUUID()
  parentCommentId?: string;
}
