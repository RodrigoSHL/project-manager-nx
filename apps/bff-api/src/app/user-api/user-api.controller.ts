import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UserApiClient } from './user-api.client';

@Controller('api')
export class UserApiController {
  constructor(private readonly userApiClient: UserApiClient) {}

  @Get('users')
  findAllUsers() {
    return this.userApiClient.findAllUsers();
  }

  @Get('users/:id')
  findOneUser(@Param('id') id: string) {
    return this.userApiClient.findOneUser(id);
  }

  @Post('workspaces')
  createWorkspace(@Body() dto: Record<string, unknown>) {
    return this.userApiClient.createWorkspace(dto);
  }

  @Get('workspaces')
  findAllWorkspaces() {
    return this.userApiClient.findAllWorkspaces();
  }

  @Get('workspaces/slug/:slug')
  findWorkspaceBySlug(@Param('slug') slug: string) {
    return this.userApiClient.findWorkspaceBySlug(slug);
  }

  @Get('workspaces/:workspaceId/members')
  findWorkspaceMembers(@Param('workspaceId') workspaceId: string) {
    return this.userApiClient.findWorkspaceMembers(workspaceId);
  }

  @Post('workspaces/:workspaceId/members')
  addWorkspaceMember(@Param('workspaceId') workspaceId: string, @Body() dto: Record<string, unknown>) {
    return this.userApiClient.addWorkspaceMember(workspaceId, dto);
  }

  @Patch('workspaces/:workspaceId/members/:userId/role')
  updateWorkspaceMemberRole(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
    @Body() dto: Record<string, unknown>,
  ) {
    return this.userApiClient.updateWorkspaceMemberRole(workspaceId, userId, dto);
  }

  @Delete('workspaces/:workspaceId/members/:userId')
  removeWorkspaceMember(@Param('workspaceId') workspaceId: string, @Param('userId') userId: string) {
    return this.userApiClient.removeWorkspaceMember(workspaceId, userId);
  }

  @Get('workspaces/:id')
  findOneWorkspace(@Param('id') id: string) {
    return this.userApiClient.findOneWorkspace(id);
  }

  @Patch('workspaces/:id')
  updateWorkspace(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return this.userApiClient.updateWorkspace(id, dto);
  }

  @Delete('workspaces/:id')
  removeWorkspace(@Param('id') id: string) {
    return this.userApiClient.removeWorkspace(id);
  }
}
