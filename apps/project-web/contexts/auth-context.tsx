"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, ShieldAlert } from "lucide-react"
import {
  buildLoginUrl,
  canAccessProjectWeb,
  clearAccessToken,
  getAccessToken,
  getAuthHeaders,
  getCurrentUser,
  type CurrentUser,
} from "@/lib/auth"

interface AuthContextValue {
  user: CurrentUser
  logout: () => void
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = React.useState<CurrentUser | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [connectionError, setConnectionError] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false

    async function verifySession() {
      const token = getAccessToken()
      const decodedUser = getCurrentUser()

      if (!token || !decodedUser) {
        clearAccessToken()
        router.replace(buildLoginUrl(token ? "expired" : undefined))
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
          cache: "no-store",
          credentials: "include",
          headers: getAuthHeaders(),
        })

        if (cancelled) return

        if (response.status === 401 || response.status === 403) {
          clearAccessToken()
          router.replace(buildLoginUrl(response.status === 403 ? "forbidden" : "expired"))
          return
        }

        if (!response.ok) {
          throw new Error(`Session verification failed with status ${response.status}`)
        }

        const profile = (await response.json()) as CurrentUser
        if (!canAccessProjectWeb(profile.roles)) {
          clearAccessToken()
          router.replace(buildLoginUrl("forbidden"))
          return
        }

        setUser(profile)
        setConnectionError(false)
        setLoading(false)
      } catch {
        if (!cancelled) {
          setConnectionError(true)
          setLoading(false)
        }
      }
    }

    void verifySession()
    return () => {
      cancelled = true
    }
  }, [router])

  const logout = React.useCallback(() => {
    clearAccessToken()
    router.replace("/login")
    router.refresh()
  }, [router])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Verificando sesión…
        </div>
      </main>
    )
  }

  if (connectionError || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-4 text-xl font-semibold">No pudimos validar tu sesión</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Revisa la conexión con el servidor e inténtalo nuevamente.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Reintentar
          </button>
        </div>
      </main>
    )
  }

  return <AuthContext.Provider value={{ user, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
