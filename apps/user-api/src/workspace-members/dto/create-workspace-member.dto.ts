import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { WorkspaceRole } from '../entities/workspace-member.entity';

export class CreateWorkspaceMemberDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(WorkspaceRole)
  @IsOptional()
  role?: WorkspaceRole = WorkspaceRole.MEMBER;
}
