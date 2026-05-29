import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WorkspaceMembersService } from './workspace-members.service';
import { CreateWorkspaceMemberDto } from './dto/create-workspace-member.dto';
import { UpdateWorkspaceMemberDto } from './dto/update-workspace-member.dto';

@Controller('workspaces/:workspaceId/members')
export class WorkspaceMembersController {
  constructor(private readonly workspaceMembersService: WorkspaceMembersService) {}

  @Post()
  addMember(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateWorkspaceMemberDto,
  ) {
    return this.workspaceMembersService.addMember(workspaceId, dto);
  }

  @Get()
  findByWorkspace(@Param('workspaceId') workspaceId: string) {
    return this.workspaceMembersService.findByWorkspace(workspaceId);
  }

  @Get(':userId/role')
  getMemberRole(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
  ) {
    return this.workspaceMembersService.getMemberRole(workspaceId, userId);
  }

  @Patch(':userId/role')
  updateRole(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateWorkspaceMemberDto,
  ) {
    return this.workspaceMembersService.updateRole(workspaceId, userId, dto);
  }

  @Delete(':userId')
  removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
  ) {
    return this.workspaceMembersService.removeMember(workspaceId, userId);
  }
}
