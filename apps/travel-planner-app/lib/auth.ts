export function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token')
  }
}
