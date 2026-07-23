const ACCESS_TOKEN_KEY = 'access_token'

export type UserRole = 'user' | 'admin'

export interface CurrentUser {
  userId: string
  email: string
  name: string
  roles: UserRole[]
}

export function canAccessProjectWeb(roles: UserRole[] | undefined): boolean {
  return Boolean(roles?.some(role => role === 'user' || role === 'admin'))
}

export function isProjectAdmin(roles: UserRole[] | undefined): boolean {
  return Boolean(roles?.includes('admin'))
}

interface JwtPayload {
  sub?: string
  email?: string
  name?: string
  roles?: UserRole[]
  exp?: number
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  }
}

export function clearAccessToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function getCurrentUser(): CurrentUser | null {
  const token = getAccessToken()
  if (!token) return null

  try {
    const encodedPayload = token.split('.')[1]
    if (!encodedPayload) return null

    const normalized = encodedPayload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    const payload = JSON.parse(atob(padded)) as JwtPayload

    if (!payload.sub || !payload.email) return null
    if (payload.exp && payload.exp * 1000 <= Date.now()) return null

    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      roles: Array.isArray(payload.roles) ? payload.roles : [],
    }
  } catch {
    return null
  }
}

export function buildLoginUrl(reason?: 'expired' | 'forbidden'): string {
  if (typeof window === 'undefined') return '/login'

  const redirect = `${window.location.pathname}${window.location.search}`
  const params = new URLSearchParams({ redirect })
  if (reason) params.set('reason', reason)
  return `/login?${params.toString()}`
}
