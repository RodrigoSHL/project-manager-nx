import { IsEnum } from 'class-validator';
import { WorkStatus } from '../entities/work.entity';

export class UpdateWorkStatusDto {
  @IsEnum(WorkStatus)
  status!: WorkStatus;
}
