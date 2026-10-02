import { IsIn } from 'class-validator';

export class UpdateWorkspaceMemberRoleDto {
  @IsIn(['owner', 'admin', 'member', 'viewer'])
  role: 'owner' | 'admin' | 'member' | 'viewer';
}
