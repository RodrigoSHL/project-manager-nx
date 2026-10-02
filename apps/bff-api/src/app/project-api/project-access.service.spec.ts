import { ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { UserApiClient, UserRole } from '../user-api/user-api.client';
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
  let userApi: { findWorkspaceMembers: jest.Mock };
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
    userApi = { findWorkspaceMembers: jest.fn() };
    service = new ProjectAccessService(
      projectClient as unknown as ProjectApiClient,
      workspaceAccess as unknown as WorkspaceAccessService,
      userApi as unknown as UserApiClient,
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

  it.each(['owner', 'admin', 'member'])('permits ticket writes for workspace %s', async role => {
    projectClient.findOne.mockResolvedValue({ id: 'project-1', workspaceId: 'workspace-1', teamMembers: [{ userId: user.userId }] });
    userApi.findWorkspaceMembers.mockResolvedValue([{ userId: user.userId, role }]);

    await expect(service.getProjectPermissions('project-1', user)).resolves.toEqual({ canWrite: true, workspaceRole: role });
    await expect(service.assertProjectWriteAccess('project-1', user)).resolves.toBeUndefined();
  });

  it('lets a viewer read the project but rejects ticket writes', async () => {
    projectClient.findOne.mockResolvedValue({ id: 'project-1', workspaceId: 'workspace-1', teamMembers: [{ userId: user.userId }] });
    userApi.findWorkspaceMembers.mockResolvedValue([{ userId: user.userId, role: 'viewer' }]);

    await expect(service.findAccessibleProject('project-1', user)).resolves.toMatchObject({ id: 'project-1' });
    await expect(service.getProjectPermissions('project-1', user)).resolves.toEqual({ canWrite: false, workspaceRole: 'viewer' });
    await expect(service.assertProjectWriteAccess('project-1', user)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects writes when the workspace membership is missing', async () => {
    projectClient.findOne.mockResolvedValue({ id: 'project-1', workspaceId: 'workspace-1', teamMembers: [{ userId: user.userId }] });
    userApi.findWorkspaceMembers.mockResolvedValue([]);
    await expect(service.assertProjectWriteAccess('project-1', user)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('uses the workspace role even when the user is a global administrator', async () => {
    projectClient.findOne.mockResolvedValue({ id: 'project-1', workspaceId: 'workspace-1' });
    userApi.findWorkspaceMembers.mockResolvedValue([{ userId: admin.userId, role: 'viewer' }]);
    await expect(service.assertProjectWriteAccess('project-1', admin)).rejects.toBeInstanceOf(ForbiddenException);
    userApi.findWorkspaceMembers.mockResolvedValue([{ userId: admin.userId, role: 'admin' }]);
    await expect(service.getProjectPermissions('project-1', admin)).resolves.toEqual({ canWrite: true, workspaceRole: 'admin' });
  });
});
