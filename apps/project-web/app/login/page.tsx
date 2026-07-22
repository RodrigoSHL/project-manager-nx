"use client"

import * as React from "react"
import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowRight,
  FolderKanban,
  Layers3,
  Loader2,
  ShieldCheck,
  Users,
} from "lucide-react"
import { setAccessToken, type CurrentUser } from "@/lib/auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api"

interface LoginResponse {
  access_token?: string
  user?: CurrentUser
}

function safeRedirect(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/"
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeRedirect(searchParams.get("redirect"))
  const reason = searchParams.get("reason")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(
    reason === "expired"
      ? "Tu sesión expiró. Inicia sesión nuevamente."
      : reason === "forbidden"
        ? "ProjectHub requiere una cuenta con rol de administrador."
        : null,
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })

      const data = (await response.json().catch(() => ({}))) as LoginResponse & {
        message?: string | string[]
      }

      if (!response.ok) {
        const message = Array.isArray(data.message) ? data.message[0] : data.message
        setError(message || "Correo o contraseña incorrectos.")
        return
      }

      if (!data.access_token || !data.user) {
        setError("El servidor no entregó una sesión válida.")
        return
      }

      if (!data.user.roles?.includes("admin")) {
        setError("Tu cuenta no tiene permisos de administrador para usar ProjectHub.")
        return
      }

      setAccessToken(data.access_token)
      router.replace(redirectTo)
      router.refresh()
    } catch {
      setError("No se pudo conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/30 p-3 sm:p-6">
      <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-blue-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 size-96 rounded-full bg-violet-300/20 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[32px] border bg-background/90 shadow-2xl shadow-foreground/10 backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden min-h-[650px] overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-20 -top-20 size-72 rounded-full border-[48px] border-white/[0.05]" />
          <div className="absolute bottom-20 left-8 size-52 rounded-full bg-blue-400/10 blur-3xl" />

          <div className="relative flex items-center gap-2.5 text-sm font-semibold">
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/10">
              <FolderKanban className="size-4" />
            </div>
            ProjectHub
          </div>

          <div className="relative max-w-md">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold">
              <ShieldCheck className="size-3.5" />
              Acceso administrativo seguro
            </span>
            <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-tight">
              Tus proyectos, equipos y operaciones en un solo lugar.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-slate-300">
              Gestiona el ciclo completo de cada iniciativa con una vista clara de responsables, infraestructura y avance.
            </p>

            <div className="mt-9 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Layers3 className="mb-3 size-5 text-blue-300" />
                <p className="text-sm font-semibold">Visión centralizada</p>
                <p className="mt-1 text-xs text-slate-400">Datos técnicos y operativos.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Users className="mb-3 size-5 text-violet-300" />
                <p className="text-sm font-semibold">Equipos coordinados</p>
                <p className="mt-1 text-xs text-slate-400">Workspaces y responsables.</p>
              </div>
            </div>
          </div>

          <p className="relative text-xs text-white/40">ProjectHub · Gestión de proyectos empresariales</p>
        </aside>

        <section className="flex min-h-[600px] flex-col justify-center px-6 py-10 sm:px-12 lg:px-14">
          <div className="mb-8 flex flex-col items-start gap-2">
            <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg lg:hidden">
              <FolderKanban className="size-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Bienvenido de vuelta</p>
            <h2 className="text-3xl font-bold tracking-tight">Inicia sesión</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Usa una cuenta con permisos de administrador.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium">Correo electrónico</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@empresa.com"
                className="h-11 rounded-xl border border-input bg-background px-3.5 text-sm shadow-sm outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium">Contraseña</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-xl border border-input bg-background px-3.5 text-sm shadow-sm outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-60"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
              Iniciar sesión
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            Las cuentas nuevas deben ser habilitadas como administradoras antes de acceder.
          </p>
        </section>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  )
}
