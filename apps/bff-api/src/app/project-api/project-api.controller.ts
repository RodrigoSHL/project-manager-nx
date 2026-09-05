import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ExpressRequestWithUser } from '../auth/types/express-request-with-user';
import { UserRole } from '../user-api/user-api.client';
import { CommentBodyDto } from './dto/comment-body.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectAccessService } from './project-access.service';
import { ProjectApiClient } from './project-api.client';

@Controller('api/projects')
@UseGuards(JwtAuthGuard)
export class ProjectApiController {
  constructor(
    private readonly projectApiClient: ProjectApiClient,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  @Get()
  findAll(
    @Request() req: ExpressRequestWithUser,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.projectAccessService.findAccessibleProjects(req.user, workspaceId);
  }

  @Get('stats')
  getStats(@Request() req: ExpressRequestWithUser) {
    return this.projectAccessService.getAccessibleStats(req.user);
  }

  @Get('status/:status')
  async findByStatus(
    @Param('status') status: string,
    @Request() req: ExpressRequestWithUser,
  ) {
    const projects = await this.projectApiClient.findByStatus(status);
    return this.projectAccessService.filterAccessibleProjects(projects, req.user);
  }

  @Get('business-unit/:businessUnit')
  async findByBusinessUnit(
    @Param('businessUnit') businessUnit: string,
    @Request() req: ExpressRequestWithUser,
  ) {
    const projects = await this.projectApiClient.findByBusinessUnit(businessUnit);
    return this.projectAccessService.filterAccessibleProjects(projects, req.user);
  }

  @Get('technologies')
  findAllTechnologies() {
    return this.projectApiClient.findAllTechnologies();
  }

  @Post(':projectId/sprints')
  async createSprint(
    @Param('projectId') projectId: string,
    @Body() dto: Record<string, unknown>,
    @Request() req: ExpressRequestWithUser,
  ) {
    await this.projectAccessService.assertProjectAccess(projectId, req.user);
    return this.projectApiClient.forwardJsonRequest(
      'POST',
      `/projects/${encodeURIComponent(projectId)}/sprints`,
      dto,
    );
  }

  @Get(':projectId/sprints')
  async findSprints(
    @Param('projectId') projectId: string,
    @Request() req: ExpressRequestWithUser,
  ) {
    await this.projectAccessService.assertProjectAccess(projectId, req.user);
    return this.projectApiClient.forwardJsonRequest(
      'GET',
      `/projects/${encodeURIComponent(projectId)}/sprints`,
    );
  }

  @Get(':projectId/sprints/:sprintId')
  async findSprint(
    @Param('projectId') projectId: string,
    @Param('sprintId') sprintId: string,
    @Request() req: ExpressRequestWithUser,
  ) {
    await this.projectAccessService.assertProjectAccess(projectId, req.user);
    return this.projectApiClient.forwardJsonRequest(
      'GET',
      `/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}`,
    );
  }

  @Patch(':projectId/sprints/:sprintId')
  async updateSprint(
    @Param('projectId') projectId: string,
    @Param('sprintId') sprintId: string,
    @Body() dto: Record<string, unknown>,
    @Request() req: ExpressRequestWithUser,
  ) {
    await this.projectAccessService.assertProjectAccess(projectId, req.user);
    return this.projectApiClient.forwardJsonRequest(
      'PATCH',
      `/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}`,
      dto,
    );
  }

  @Patch(':projectId/sprints/:sprintId/activate')
  async activateSprint(
    @Param('projectId') projectId: string,
    @Param('sprintId') sprintId: string,
    @Request() req: ExpressRequestWithUser,
  ) {
    await this.projectAccessService.assertProjectAccess(projectId, req.user);
    return this.projectApiClient.forwardJsonRequest(
      'PATCH',
      `/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}/activate`,
    );
  }

  @Delete(':projectId/sprints/:sprintId')
  async removeSprint(
    @Param('projectId') projectId: string,
    @Param('sprintId') sprintId: string,
    @Request() req: ExpressRequestWithUser,
  ) {
    await this.projectAccessService.assertProjectAccess(projectId, req.user);
    return this.projectApiClient.forwardJsonRequest(
      'DELETE',
      `/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}`,
    );
  }

  @Post(':projectId/tickets')
  async createTicket(
    @Param('projectId') projectId: string,
    @Body() dto: Record<string, unknown>,
    @Request() req: ExpressRequestWithUser,
  ) {
    await this.projectAccessService.assertProjectAccess(projectId, req.user);
    return this.projectApiClient.forwardJsonRequest(
      'POST',
      `/projects/${encodeURIComponent(projectId)}/tickets`,
      dto,
    );
  }

  @Get(':projectId/tickets')
  async findTickets(
    @Param('projectId') projectId: string,
    @Request() req: ExpressRequestWithUser,
  ) {
    await this.projectAccessService.assertProjectAccess(projectId, req.user);
    return this.projectApiClient.forwardJsonRequest(
      'GET',
      `/projects/${encodeURIComponent(projectId)}/tickets`,
    );
  }

  @Get(':projectId/tickets/:ticketId')
  async findTicket(
    @Param('projectId') projectId: string,
    @Param('ticketId') ticketId: string,
    @Request() req: ExpressRequestWithUser,
  ) {
    await this.projectAccessService.assertProjectAccess(projectId, req.user);
    return this.projectApiClient.forwardJsonRequest(
      'GET',
      `/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}`,
    );
  }

  @Patch(':projectId/tickets/:ticketId')
  async updateTicket(
    @Param('projectId') projectId: string,
    @Param('ticketId') ticketId: string,
    @Body() dto: Record<string, unknown>,
    @Request() req: ExpressRequestWithUser,
  ) {
    await this.projectAccessService.assertProjectAccess(projectId, req.user);
    return this.projectApiClient.forwardJsonRequest(
      'PATCH',
      `/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}`,
      dto,
    );
  }

  @Delete(':projectId/tickets/:ticketId')
  async removeTicket(
    @Param('projectId') projectId: string,
    @Param('ticketId') ticketId: string,
    @Request() req: ExpressRequestWithUser,
  ) {
    await this.projectAccessService.assertProjectAccess(projectId, req.user);
    return this.projectApiClient.forwardJsonRequest(
      'DELETE',
      `/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}`,
    );
  }

  @Get(':projectId/tickets/:ticketId/comments')
  async findTicketComments(
    @Param('projectId') projectId: string,
    @Param('ticketId') ticketId: string,
    @Request() req: ExpressRequestWithUser,
  ) {
    await this.projectAccessService.assertProjectAccess(projectId, req.user);
    return this.projectApiClient.findTicketComments(projectId, ticketId);
  }

  @Post(':projectId/tickets/:ticketId/comments')
  @HttpCode(HttpStatus.CREATED)
  async createTicketComment(
    @Param('projectId') projectId: string,
    @Param('ticketId') ticketId: string,
    @Body() dto: CommentBodyDto,
    @Request() req: ExpressRequestWithUser,
  ) {
    await this.projectAccessService.assertProjectAccess(projectId, req.user);
    return this.projectApiClient.createTicketComment(
      projectId,
      ticketId,
      dto.body.trim(),
      req.user,
    );
  }

  @Patch(':projectId/tickets/:ticketId/comments/:commentId')
  async updateTicketComment(
    @Param('projectId') projectId: string,
    @Param('ticketId') ticketId: string,
    @Param('commentId') commentId: string,
    @Body() dto: CommentBodyDto,
    @Request() req: ExpressRequestWithUser,
  ) {
    await this.projectAccessService.assertProjectAccess(projectId, req.user);
    return this.projectApiClient.updateTicketComment(
      projectId,
      ticketId,
      commentId,
      dto.body.trim(),
      req.user,
    );
  }

  @Delete(':projectId/tickets/:ticketId/comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTicketComment(
    @Param('projectId') projectId: string,
    @Param('ticketId') ticketId: string,
    @Param('commentId') commentId: string,
    @Request() req: ExpressRequestWithUser,
  ) {
    await this.projectAccessService.assertProjectAccess(projectId, req.user);
    return this.projectApiClient.deleteTicketComment(
      projectId,
      ticketId,
      commentId,
      req.user,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: ExpressRequestWithUser) {
    return this.projectAccessService.findAccessibleProject(id, req.user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateProjectDto, @Request() req: ExpressRequestWithUser) {
    return this.projectApiClient.createProject(dto, req.user);
  }

  @Post('seed')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  runSeed(@Request() req: ExpressRequestWithUser) {
    return this.projectApiClient.runSeed(req.user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: Record<string, unknown>,
    @Request() req: ExpressRequestWithUser,
  ) {
    return this.projectApiClient.updateProject(id, dto, req.user);
  }

  @Patch(':id/granular')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  granularUpdate(
    @Param('id') id: string,
    @Body() dto: Record<string, unknown>,
    @Request() req: ExpressRequestWithUser,
  ) {
    return this.projectApiClient.granularUpdateProject(id, dto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req: ExpressRequestWithUser) {
    return this.projectApiClient.deleteProject(id, req.user);
  }
}
