import { IsString, IsOptional, IsBoolean, IsUUID, MaxLength } from 'class-validator';

export class UpdateSubtaskDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  title?: string;

  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @IsUUID()
  @IsOptional()
  assigneeId?: string;
}
