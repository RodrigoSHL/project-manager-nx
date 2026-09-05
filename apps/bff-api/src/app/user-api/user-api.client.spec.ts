import { HttpException } from '@nestjs/common';
import { UserApiClient, UserRole } from './user-api.client';

describe('UserApiClient user administration', () => {
  let client: UserApiClient;
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    process.env.USER_API_URL = 'http://user-api.test/api';
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    client = new UserApiClient();
  });

  afterEach(() => {
    delete process.env.USER_API_URL;
  });

  it('creates a user through user-api', async () => {
    const created = {
      id: 'user-1',
      email: 'new@example.com',
      name: 'New User',
      roles: [UserRole.USER, UserRole.ADMIN],
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify(created), { status: 201 }));

    await expect(client.createUser({
      email: created.email,
      name: created.name,
      password: 'password-123',
      roles: [UserRole.USER, UserRole.ADMIN],
    })).resolves.toEqual(created);
    expect(fetchMock).toHaveBeenCalledWith('http://user-api.test/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: created.email,
        name: created.name,
        password: 'password-123',
        roles: [UserRole.USER, UserRole.ADMIN],
      }),
    });
  });

  it('preserves a conflict response from user-api', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      message: 'A user with this email already exists',
    }), { status: 409 }));

    let caught: unknown;
    try {
      await client.createUser({
        email: 'existing@example.com',
        name: 'Existing',
        password: 'password-123',
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(HttpException);
    expect((caught as HttpException).getStatus()).toBe(409);
    expect((caught as HttpException).getResponse()).toEqual({
      message: 'A user with this email already exists',
    });
  });

  it('requests only workspaces linked to the authenticated user', async () => {
    const workspaces = [{ id: 'workspace-1', name: 'Workspace 1', slug: 'workspace-1' }];
    fetchMock.mockResolvedValue(new Response(JSON.stringify(workspaces), { status: 200 }));

    await expect(client.findWorkspacesForUser('user/1')).resolves.toEqual(workspaces);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://user-api.test/api/workspaces/for-user/user%2F1',
      { method: 'GET' },
    );
  });
});
