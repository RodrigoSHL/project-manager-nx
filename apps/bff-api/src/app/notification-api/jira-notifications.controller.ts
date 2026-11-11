import {
  Controller,
  ForbiddenException,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsIn, IsInt, Max, Min } from 'class-validator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ExpressRequestWithUser } from '../auth/types/express-request-with-user';
import { ProjectAccessService } from '../project-api/project-access.service';
import { ProjectApiProject } from '../project-api/project-api.client';
import { UserRole } from '../user-api/user-api.client';
import { NotificationApiClient } from './notification-api.client';

export class JiraNotificationQuery {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;

  @IsIn(['all', 'unread'])
  status: 'all' | 'unread' = 'all';
}

@Controller('api/jira/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER, UserRole.ADMIN)
export class JiraNotificationsController {
  constructor(
    private readonly projects: ProjectAccessService,
    private readonly notifications: NotificationApiClient
  ) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async list(
    @Request() request: ExpressRequestWithUser,
    @Query() query: JiraNotificationQuery
  ) {
    const projects = await this.projects.findAccessibleProjects(request.user);
    const projectIds = projects
      .filter((project) => this.hasActiveMembership(project, request.user))
      .map((project) => project.id);

    if (!projectIds.length) {
      return {
        items: [],
        total: 0,
        unreadCount: 0,
        page: query.page,
        limit: query.limit,
      };
    }

    return this.notifications.inbox(request.user.userId, projectIds, query);
  }

  @Patch(':projectId/:id/read')
  async markRead(
    @Request() request: ExpressRequestWithUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    const project = await this.projects.findAccessibleProject(
      projectId,
      request.user
    );
    if (!this.hasActiveMembership(project, request.user)) {
      throw new ForbiddenException('Project access denied');
    }
    return this.notifications.markRead(request.user.userId, projectId, id);
  }

  private hasActiveMembership(
    project: ProjectApiProject,
    user: AuthenticatedUser
  ) {
    return (
      user.roles.includes(UserRole.ADMIN) ||
      project.teamMembers?.some(
        (member) => member.userId === user.userId && member.isActive !== false
      )
    );
  }
}
