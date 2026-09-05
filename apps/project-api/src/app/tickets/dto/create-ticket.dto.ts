import {
  IsString, IsNotEmpty, IsOptional, IsEnum,
  IsUUID, IsInt, IsDateString, MaxLength, Min,
} from 'class-validator';
import { TicketStatus, TicketPriority, TicketType } from '../entities/ticket.entity';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10000)
  acceptanceCriteria?: string;

  @IsEnum(TicketType)
  @IsOptional()
  type?: TicketType;

  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;

  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @IsUUID()
  @IsOptional()
  sprintId?: string;

  @IsUUID()
  @IsOptional()
  assigneeId?: string | null;

  @IsUUID()
  @IsOptional()
  reporterId?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  storyPoints?: number;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
