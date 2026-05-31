import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ExpressRequestWithUser } from '../auth/types/express-request-with-user';
import { UserRole } from '../user-api/user-api.client';
import { CreateProjectDto } from './dto/create-project.dto';
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
