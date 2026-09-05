import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ExpressRequestWithUser } from '../auth/types/express-request-with-user';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserApiClient, UserRole } from './user-api.client';
import { WorkspaceAccessService } from './workspace-access.service';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class UserApiController {
  constructor(
    private readonly userApiClient: UserApiClient,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

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
      roles: dto.roles?.length ? dto.roles : [UserRole.USER],
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
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  createWorkspace(@Body() dto: Record<string, unknown>) {
    return this.userApiClient.createWorkspace(dto);
  }

  @Get('workspaces')
  findAllWorkspaces(@Request() req: ExpressRequestWithUser) {
    return this.workspaceAccessService.findAccessibleWorkspaces(req.user);
  }

  @Get('workspaces/slug/:slug')
  async findWorkspaceBySlug(@Param('slug') slug: string, @Request() req: ExpressRequestWithUser) {
    const workspace = await this.userApiClient.findWorkspaceBySlug(slug);
    return this.workspaceAccessService.assertWorkspaceAccess(workspace, req.user);
  }

  @Get('workspaces/:workspaceId/members')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findWorkspaceMembers(@Param('workspaceId') workspaceId: string) {
    return this.userApiClient.findWorkspaceMembers(workspaceId);
  }

  @Post('workspaces/:workspaceId/members')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  addWorkspaceMember(@Param('workspaceId') workspaceId: string, @Body() dto: Record<string, unknown>) {
    return this.userApiClient.addWorkspaceMember(workspaceId, dto);
  }

  @Patch('workspaces/:workspaceId/members/:userId/role')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateWorkspaceMemberRole(
    @Param('workspaceId') workspaceId: string,
    @Param('userId') userId: string,
    @Body() dto: Record<string, unknown>,
  ) {
    return this.userApiClient.updateWorkspaceMemberRole(workspaceId, userId, dto);
  }

  @Delete('workspaces/:workspaceId/members/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  removeWorkspaceMember(@Param('workspaceId') workspaceId: string, @Param('userId') userId: string) {
    return this.userApiClient.removeWorkspaceMember(workspaceId, userId);
  }

  @Get('workspaces/:id')
  async findOneWorkspace(@Param('id') id: string, @Request() req: ExpressRequestWithUser) {
    const workspace = await this.userApiClient.findOneWorkspace(id);
    return this.workspaceAccessService.assertWorkspaceAccess(workspace, req.user);
  }

  @Patch('workspaces/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateWorkspace(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return this.userApiClient.updateWorkspace(id, dto);
  }

  @Delete('workspaces/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  removeWorkspace(@Param('id') id: string) {
    return this.userApiClient.removeWorkspace(id);
  }
}
