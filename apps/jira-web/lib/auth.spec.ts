import {
  buildLoginUrl,
  clearAccessToken,
  getAuthHeaders,
  getCurrentUser,
  setAccessToken,
} from './auth'

const storage = new Map<string, string>()

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    clear: () => storage.clear(),
    getItem: (key: string) => storage.get(key) ?? null,
    removeItem: (key: string) => storage.delete(key),
    setItem: (key: string, value: string) => storage.set(key, value),
  },
})

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    location: {
      pathname: '/',
      search: '?view=backlog',
    },
  },
})

function encode(value: unknown): string {
  return btoa(JSON.stringify(value))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function token(payload: Record<string, unknown>): string {
  return `${encode({ alg: 'none' })}.${encode(payload)}.signature`
}

describe('jira-web auth helpers', () => {
  beforeEach(() => {
    localStorage.clear()
    window.location.pathname = '/'
    window.location.search = '?view=backlog'
  })

  it('stores the access token and builds the Bearer header', () => {
    setAccessToken('jwt-token')

    expect(getAuthHeaders()).toEqual({ Authorization: 'Bearer jwt-token' })
  })

  it('reads the authenticated user and roles from the JWT', () => {
    setAccessToken(token({
      sub: 'user-1',
      email: 'admin@example.com',
      name: 'Admin User',
      roles: ['user', 'admin'],
      exp: Math.floor(Date.now() / 1000) + 3600,
    }))

    expect(getCurrentUser()).toEqual({
      userId: 'user-1',
      email: 'admin@example.com',
      name: 'Admin User',
      roles: ['user', 'admin'],
    })
  })

  it('rejects expired tokens', () => {
    setAccessToken(token({
      sub: 'user-1',
      email: 'admin@example.com',
      roles: ['admin'],
      exp: Math.floor(Date.now() / 1000) - 1,
    }))

    expect(getCurrentUser()).toBeNull()
  })

  it('preserves the current route when redirecting to login', () => {
    expect(buildLoginUrl('expired')).toBe(
      '/login?redirect=%2F%3Fview%3Dbacklog&reason=expired',
    )
  })

  it('clears the stored access token', () => {
    setAccessToken('jwt-token')
    clearAccessToken()

    expect(getAuthHeaders()).toEqual({})
  })
})
