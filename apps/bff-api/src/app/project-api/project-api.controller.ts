import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ExpressRequestWithUser } from '../auth/types/express-request-with-user';
import { UserRole } from '../user-api/user-api.client';
import { CreateProjectDto } from './dto/create-project.dto';
import { CommentBodyDto } from './dto/comment-body.dto';
import { ProjectApiClient } from './project-api.client';

@Controller('api/projects')
export class ProjectApiController {
  constructor(private readonly projectApiClient: ProjectApiClient) {}

  @Get()
  findAll(@Query('workspaceId') workspaceId?: string) {
    return this.projectApiClient.findAll(workspaceId);
  }

  @Get('stats')
  getStats() {
    return this.projectApiClient.getProjectStats();
  }

  @Get('status/:status')
  findByStatus(@Param('status') status: string) {
    return this.projectApiClient.findByStatus(status);
  }

  @Get('business-unit/:businessUnit')
  findByBusinessUnit(@Param('businessUnit') businessUnit: string) {
    return this.projectApiClient.findByBusinessUnit(businessUnit);
  }

  @Get('technologies')
  findAllTechnologies() {
    return this.projectApiClient.findAllTechnologies();
  }

  @Post(':projectId/sprints')
  createSprint(@Param('projectId') projectId: string, @Body() dto: Record<string, unknown>) {
    return this.projectApiClient.forwardJsonRequest('POST', `/projects/${encodeURIComponent(projectId)}/sprints`, dto);
  }

  @Get(':projectId/sprints')
  findSprints(@Param('projectId') projectId: string) {
    return this.projectApiClient.forwardJsonRequest('GET', `/projects/${encodeURIComponent(projectId)}/sprints`);
  }

  @Get(':projectId/sprints/:sprintId')
  findSprint(@Param('projectId') projectId: string, @Param('sprintId') sprintId: string) {
    return this.projectApiClient.forwardJsonRequest(
      'GET',
      `/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}`,
    );
  }

  @Patch(':projectId/sprints/:sprintId')
  updateSprint(
    @Param('projectId') projectId: string,
    @Param('sprintId') sprintId: string,
    @Body() dto: Record<string, unknown>,
  ) {
    return this.projectApiClient.forwardJsonRequest(
      'PATCH',
      `/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}`,
      dto,
    );
  }

  @Patch(':projectId/sprints/:sprintId/activate')
  activateSprint(@Param('projectId') projectId: string, @Param('sprintId') sprintId: string) {
    return this.projectApiClient.forwardJsonRequest(
      'PATCH',
      `/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}/activate`,
    );
  }

  @Delete(':projectId/sprints/:sprintId')
  removeSprint(@Param('projectId') projectId: string, @Param('sprintId') sprintId: string) {
    return this.projectApiClient.forwardJsonRequest(
      'DELETE',
      `/projects/${encodeURIComponent(projectId)}/sprints/${encodeURIComponent(sprintId)}`,
    );
  }

  @Post(':projectId/tickets')
  createTicket(@Param('projectId') projectId: string, @Body() dto: Record<string, unknown>) {
    return this.projectApiClient.forwardJsonRequest('POST', `/projects/${encodeURIComponent(projectId)}/tickets`, dto);
  }

  @Get(':projectId/tickets')
  findTickets(@Param('projectId') projectId: string) {
    return this.projectApiClient.forwardJsonRequest('GET', `/projects/${encodeURIComponent(projectId)}/tickets`);
  }

  @Get(':projectId/tickets/:ticketId')
  findTicket(@Param('projectId') projectId: string, @Param('ticketId') ticketId: string) {
    return this.projectApiClient.forwardJsonRequest(
      'GET',
      `/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}`,
    );
  }

  @Patch(':projectId/tickets/:ticketId')
  updateTicket(
    @Param('projectId') projectId: string,
    @Param('ticketId') ticketId: string,
    @Body() dto: Record<string, unknown>,
  ) {
    return this.projectApiClient.forwardJsonRequest(
      'PATCH',
      `/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}`,
      dto,
    );
  }

  @Delete(':projectId/tickets/:ticketId')
  removeTicket(@Param('projectId') projectId: string, @Param('ticketId') ticketId: string) {
    return this.projectApiClient.forwardJsonRequest(
      'DELETE',
      `/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}`,
    );
  }

  @Get(':projectId/tickets/:ticketId/comments')
  @UseGuards(JwtAuthGuard)
  findTicketComments(
    @Param('projectId') projectId: string,
    @Param('ticketId') ticketId: string,
  ) {
    return this.projectApiClient.findTicketComments(projectId, ticketId);
  }

  @Post(':projectId/tickets/:ticketId/comments')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  createTicketComment(
    @Param('projectId') projectId: string,
    @Param('ticketId') ticketId: string,
    @Body() dto: CommentBodyDto,
    @Request() req: ExpressRequestWithUser,
  ) {
    return this.projectApiClient.createTicketComment(projectId, ticketId, dto.body.trim(), req.user);
  }

  @Patch(':projectId/tickets/:ticketId/comments/:commentId')
  @UseGuards(JwtAuthGuard)
  updateTicketComment(
    @Param('projectId') projectId: string,
    @Param('ticketId') ticketId: string,
    @Param('commentId') commentId: string,
    @Body() dto: CommentBodyDto,
    @Request() req: ExpressRequestWithUser,
  ) {
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
  @UseGuards(JwtAuthGuard)
  deleteTicketComment(
    @Param('projectId') projectId: string,
    @Param('ticketId') ticketId: string,
    @Param('commentId') commentId: string,
    @Request() req: ExpressRequestWithUser,
  ) {
    return this.projectApiClient.deleteTicketComment(projectId, ticketId, commentId, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectApiClient.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateProjectDto, @Request() req: ExpressRequestWithUser) {
    return this.projectApiClient.createProject(dto, req.user);
  }

  @Post('seed')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  runSeed(@Request() req: ExpressRequestWithUser) {
    return this.projectApiClient.runSeed(req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: Record<string, unknown>, @Request() req: ExpressRequestWithUser) {
    return this.projectApiClient.updateProject(id, dto, req.user);
  }

  @Patch(':id/granular')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  granularUpdate(@Param('id') id: string, @Body() dto: Record<string, unknown>, @Request() req: ExpressRequestWithUser) {
    return this.projectApiClient.granularUpdateProject(id, dto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req: ExpressRequestWithUser) {
    return this.projectApiClient.deleteProject(id, req.user);
  }
}
