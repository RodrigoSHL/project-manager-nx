import { ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { UserApiClient, UserRole } from './user-api.client';
import { WorkspaceAccessService } from './workspace-access.service';

describe('WorkspaceAccessService', () => {
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
  let client: {
    findAllWorkspaces: jest.Mock;
    findWorkspacesForUser: jest.Mock;
  };
  let service: WorkspaceAccessService;

  beforeEach(() => {
    client = {
      findAllWorkspaces: jest.fn(),
      findWorkspacesForUser: jest.fn(),
    };
    service = new WorkspaceAccessService(client as unknown as UserApiClient);
  });

  it('returns every workspace to administrators', async () => {
    client.findAllWorkspaces.mockResolvedValue([{ id: 'workspace-1' }]);

    await expect(service.findAccessibleWorkspaces(admin)).resolves.toEqual([
      { id: 'workspace-1' },
    ]);
    expect(client.findWorkspacesForUser).not.toHaveBeenCalled();
  });

  it('returns only memberships for regular users', async () => {
    client.findWorkspacesForUser.mockResolvedValue([{ id: 'workspace-1' }]);

    await expect(service.findAccessibleWorkspaces(user)).resolves.toEqual([
      { id: 'workspace-1' },
    ]);
    expect(client.findWorkspacesForUser).toHaveBeenCalledWith('user-1');
  });

  it('rejects a workspace without membership', async () => {
    client.findWorkspacesForUser.mockResolvedValue([{ id: 'workspace-2' }]);

    await expect(service.assertWorkspaceAccess({
      id: 'workspace-1',
      name: 'Workspace 1',
      slug: 'workspace-1',
    }, user)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
