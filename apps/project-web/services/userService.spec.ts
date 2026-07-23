import { authenticatedFetch } from '@/lib/api'
import { UserService } from './userService'

jest.mock('@/lib/api', () => ({ authenticatedFetch: jest.fn() }))

const mockedFetch = jest.mocked(authenticatedFetch)

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response
}

describe('project-web user service', () => {
  beforeEach(() => mockedFetch.mockReset())

  it('sends the initial password when creating a user', async () => {
    const dto = {
      name: 'New User',
      email: 'new@example.com',
      password: 'password-123',
      roles: ['user' as const],
    }
    const created = { id: 'user-1', ...dto, createdAt: '', updatedAt: '' }
    mockedFetch.mockResolvedValue(response(created, 201))

    await expect(UserService.create(dto)).resolves.toEqual(created)
    expect(mockedFetch).toHaveBeenCalledWith('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    })
  })

  it('shows the first validation error returned by the BFF', async () => {
    mockedFetch.mockResolvedValue(response({ message: ['password must be longer than or equal to 8 characters'] }, 400))

    await expect(UserService.create({
      name: 'New User',
      email: 'new@example.com',
      password: 'short',
      roles: ['user'],
    })).rejects.toThrow('password must be longer than or equal to 8 characters')
  })
})
