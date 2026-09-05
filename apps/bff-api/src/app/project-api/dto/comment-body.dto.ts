import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CommentBodyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  body: string;
}
