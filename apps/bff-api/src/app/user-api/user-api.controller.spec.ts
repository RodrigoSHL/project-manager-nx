import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserApiClient, UserRole } from './user-api.client';
import { UserApiController } from './user-api.controller';
import { WorkspaceAccessService } from './workspace-access.service';

describe('UserApiController user roles', () => {
  let client: { createUser: jest.Mock };
  let controller: UserApiController;

  beforeEach(() => {
    client = { createUser: jest.fn() };
    controller = new UserApiController(
      client as unknown as UserApiClient,
      {} as WorkspaceAccessService,
    );
  });

  it('uses the selected roles when an administrator creates a user', async () => {
    client.createUser.mockResolvedValue({ id: 'user-1' });

    await controller.createUser({
      email: ' USER@Example.com ',
      name: ' New User ',
      password: 'password-123',
      roles: [UserRole.USER, UserRole.ADMIN],
    });

    expect(client.createUser).toHaveBeenCalledWith({
      email: 'user@example.com',
      name: 'New User',
      password: 'password-123',
      roles: [UserRole.USER, UserRole.ADMIN],
    });
  });

  it('defaults to the user role when no role is provided', async () => {
    client.createUser.mockResolvedValue({ id: 'user-1' });

    await controller.createUser({
      email: 'user@example.com',
      name: 'New User',
      password: 'password-123',
    });

    expect(client.createUser).toHaveBeenCalledWith({
      email: 'user@example.com',
      name: 'New User',
      password: 'password-123',
      roles: [UserRole.USER],
    });
  });
});

describe('UserApiController workspace role updates', () => {
  it('keeps workspace role editing restricted to global administrators', () => {
    const handler = UserApiController.prototype.updateWorkspaceMemberRole;
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([UserRole.ADMIN]);
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toContain(RolesGuard);
  });

  it('forwards the workspace, user and selected role to User API', async () => {
    const client = { updateWorkspaceMemberRole: jest.fn().mockResolvedValue({ role: 'viewer' }) };
    const controller = new UserApiController(client as unknown as UserApiClient, {} as WorkspaceAccessService);
    await expect(controller.updateWorkspaceMemberRole('workspace-1', 'user-1', { role: 'viewer' }))
      .resolves.toEqual({ role: 'viewer' });
    expect(client.updateWorkspaceMemberRole).toHaveBeenCalledWith('workspace-1', 'user-1', { role: 'viewer' });
  });
});
