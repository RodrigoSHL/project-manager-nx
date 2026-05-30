import { Body, Controller, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateProjectDto, @Request() req: ExpressRequestWithUser) {
    return this.projectApiClient.createProject(dto, req.user);
  }
}
