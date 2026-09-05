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
