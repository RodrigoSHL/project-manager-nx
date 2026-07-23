import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserApiClient, UserRole } from './user-api.client';

@Controller('api')
export class UserApiController {
  constructor(private readonly userApiClient: UserApiClient) {}

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllUsers() {
    return this.userApiClient.findAllUsers();
  }

  @Get('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findOneUser(@Param('id') id: string) {
    return this.userApiClient.findOneUser(id);
  }

  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  createUser(@Body() dto: CreateUserDto) {
    return this.userApiClient.createUser({
      ...dto,
      email: dto.email.trim().toLowerCase(),
      name: dto.name.trim(),
    });
  }

  @Patch('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userApiClient.updateUser(id, {
      ...dto,
      ...(dto.email ? { email: dto.email.trim().toLowerCase() } : {}),
      ...(dto.name ? { name: dto.name.trim() } : {}),
    });
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  removeUser(@Param('id') id: string) {
    return this.userApiClient.removeUser(id);
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
