import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { WorkspaceAccessService } from '../user-api/workspace-access.service';
import { ProjectApiClient, ProjectApiProject } from './project-api.client';

@Injectable()
export class ProjectAccessService {
  constructor(
    private readonly projectApiClient: ProjectApiClient,
    private readonly workspaceAccessService: WorkspaceAccessService,
  ) {}

  async findAccessibleProjects(
    user: AuthenticatedUser,
    workspaceId?: string,
  ): Promise<ProjectApiProject[]> {
    if (this.workspaceAccessService.isAdmin(user)) {
      return this.projectApiClient.findAll(workspaceId);
    }

    const accessibleWorkspaces = await this.workspaceAccessService.findAccessibleWorkspaces(user);
    const workspaceIds = new Set(accessibleWorkspaces.map((workspace) => workspace.id));

    if (workspaceId && !workspaceIds.has(workspaceId)) {
      throw new ForbiddenException('Workspace access denied');
    }

    if (workspaceIds.size === 0) return [];

    const projects = await this.projectApiClient.findAll(workspaceId);
    return this.filterByMembership(projects, workspaceIds, user.userId);
  }

  async filterAccessibleProjects(
    projects: ProjectApiProject[],
    user: AuthenticatedUser,
  ): Promise<ProjectApiProject[]> {
    if (this.workspaceAccessService.isAdmin(user)) return projects;

    const accessibleWorkspaces = await this.workspaceAccessService.findAccessibleWorkspaces(user);
    return this.filterByMembership(
      projects,
      new Set(accessibleWorkspaces.map((workspace) => workspace.id)),
      user.userId,
    );
  }

  async findAccessibleProject(
    projectId: string,
    user: AuthenticatedUser,
  ): Promise<ProjectApiProject> {
    const project = await this.projectApiClient.findOne(projectId);
    if (this.workspaceAccessService.isAdmin(user)) return project;

    if (!project.workspaceId) {
      throw new ForbiddenException('Project access denied');
    }

    await this.workspaceAccessService.assertWorkspaceIdAccess(project.workspaceId, user);

    if (!this.hasProjectMembership(project, user.userId)) {
      throw new ForbiddenException('Project access denied');
    }

    return project;
  }

  async assertProjectAccess(projectId: string, user: AuthenticatedUser): Promise<void> {
    await this.findAccessibleProject(projectId, user);
  }

  async getAccessibleStats(user: AuthenticatedUser) {
    if (this.workspaceAccessService.isAdmin(user)) {
      return this.projectApiClient.getProjectStats();
    }

    const projects = await this.findAccessibleProjects(user);
    return {
      totalProjects: projects.length,
      byStatus: this.countBy(projects, 'status', 'status'),
      byPriority: this.countBy(projects, 'priority', 'priority'),
    };
  }

  private filterByMembership(
    projects: ProjectApiProject[],
    workspaceIds: Set<string>,
    userId: string,
  ): ProjectApiProject[] {
    return projects.filter((project) =>
      Boolean(project.workspaceId)
      && workspaceIds.has(project.workspaceId as string)
      && this.hasProjectMembership(project, userId)
    );
  }

  private hasProjectMembership(project: ProjectApiProject, userId: string): boolean {
    return Boolean(project.teamMembers?.some((member) => member.userId === userId));
  }

  private countBy(
    projects: ProjectApiProject[],
    field: 'status' | 'priority',
    resultKey: 'status' | 'priority',
  ): Array<Record<string, string>> {
    const counts = new Map<string, number>();
    for (const project of projects) {
      const value = project[field];
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    }

    return [...counts].map(([value, count]) => ({
      [resultKey]: value,
      count: String(count),
    }));
  }
}
