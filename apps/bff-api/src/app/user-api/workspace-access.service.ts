import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { UserApiClient, UserApiWorkspace, UserRole } from './user-api.client';

@Injectable()
export class WorkspaceAccessService {
  constructor(private readonly userApiClient: UserApiClient) {}

  isAdmin(user: AuthenticatedUser): boolean {
    return user.roles.includes(UserRole.ADMIN);
  }

  findAccessibleWorkspaces(user: AuthenticatedUser): Promise<UserApiWorkspace[]> {
    return this.isAdmin(user)
      ? this.userApiClient.findAllWorkspaces()
      : this.userApiClient.findWorkspacesForUser(user.userId);
  }

  async assertWorkspaceAccess(
    workspace: UserApiWorkspace,
    user: AuthenticatedUser,
  ): Promise<UserApiWorkspace> {
    await this.assertWorkspaceIdAccess(workspace.id, user);
    return workspace;
  }

  async assertWorkspaceIdAccess(workspaceId: string, user: AuthenticatedUser): Promise<void> {
    if (this.isAdmin(user)) return;
    const accessible = await this.userApiClient.findWorkspacesForUser(user.userId);
    if (!accessible.some((candidate) => candidate.id === workspaceId)) {
      throw new ForbiddenException('Workspace access denied');
    }
  }
}
