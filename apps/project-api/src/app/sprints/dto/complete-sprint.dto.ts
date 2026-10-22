import { IsOptional, IsUUID } from 'class-validator';

export class CompleteSprintDto {
  // Omitted or null sends unfinished tickets to the backlog.
  @IsOptional()
  @IsUUID()
  targetSprintId?: string | null;
}
