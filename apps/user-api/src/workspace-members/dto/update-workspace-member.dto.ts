import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkspaceMemberDto } from './create-workspace-member.dto';

export class UpdateWorkspaceMemberDto extends PartialType(
  CreateWorkspaceMemberDto
) {}
