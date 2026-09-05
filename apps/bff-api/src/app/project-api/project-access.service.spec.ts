import { ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { UserRole } from '../user-api/user-api.client';
import { WorkspaceAccessService } from '../user-api/workspace-access.service';
import { ProjectAccessService } from './project-access.service';
import { ProjectApiClient } from './project-api.client';

describe('ProjectAccessService', () => {
  const admin: AuthenticatedUser = {
    userId: 'admin-1',
    email: 'admin@example.com',
    name: 'Admin',
    roles: [UserRole.ADMIN],
  };
  const user: AuthenticatedUser = {
    userId: 'user-1',
    email: 'user@example.com',
    name: 'User',
    roles: [UserRole.USER],
  };
  let projectClient: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    getProjectStats: jest.Mock;
  };
  let workspaceAccess: {
    isAdmin: jest.Mock;
    findAccessibleWorkspaces: jest.Mock;
    assertWorkspaceIdAccess: jest.Mock;
  };
  let service: ProjectAccessService;

  beforeEach(() => {
    projectClient = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      getProjectStats: jest.fn(),
    };
    workspaceAccess = {
      isAdmin: jest.fn((candidate) => candidate.roles.includes(UserRole.ADMIN)),
      findAccessibleWorkspaces: jest.fn(),
      assertWorkspaceIdAccess: jest.fn(),
    };
    service = new ProjectAccessService(
      projectClient as unknown as ProjectApiClient,
      workspaceAccess as unknown as WorkspaceAccessService,
    );
  });

  it('keeps global project visibility for administrators', async () => {
    projectClient.findAll.mockResolvedValue([{ id: 'project-1' }]);

    await expect(service.findAccessibleProjects(admin)).resolves.toEqual([
      { id: 'project-1' },
    ]);
    expect(workspaceAccess.findAccessibleWorkspaces).not.toHaveBeenCalled();
  });

  it('requires both workspace and project membership for users', async () => {
    workspaceAccess.findAccessibleWorkspaces.mockResolvedValue([{ id: 'workspace-1' }]);
    projectClient.findAll.mockResolvedValue([
      {
        id: 'project-1',
        workspaceId: 'workspace-1',
        teamMembers: [{ userId: 'user-1' }],
      },
      {
        id: 'project-2',
        workspaceId: 'workspace-1',
        teamMembers: [{ userId: 'other-user' }],
      },
      {
        id: 'project-3',
        workspaceId: 'workspace-2',
        teamMembers: [{ userId: 'user-1' }],
      },
    ]);

    await expect(service.findAccessibleProjects(user)).resolves.toEqual([
      {
        id: 'project-1',
        workspaceId: 'workspace-1',
        teamMembers: [{ userId: 'user-1' }],
      },
    ]);
  });

  it('rejects direct access when the user is not a project member', async () => {
    projectClient.findOne.mockResolvedValue({
      id: 'project-1',
      workspaceId: 'workspace-1',
      teamMembers: [{ userId: 'other-user' }],
    });
    workspaceAccess.assertWorkspaceIdAccess.mockResolvedValue(undefined);

    await expect(service.findAccessibleProject('project-1', user))
      .rejects.toBeInstanceOf(ForbiddenException);
  });
});
