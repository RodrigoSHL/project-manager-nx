"use client"

import { SettingsDashboard } from "@/components/settings/settings-dashboard"
import { useAuth } from "@/contexts/auth-context"
import { isProjectAdmin } from "@/lib/auth"
import { ShieldAlert } from "lucide-react"

export default function SettingsPage() {
  const { user } = useAuth()

  if (!isProjectAdmin(user.roles)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-4 text-xl font-semibold">Acceso restringido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            La administración de usuarios y workspaces requiere el rol de administrador.
          </p>
          <a
            href="/"
            className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Volver al inicio
          </a>
        </div>
      </main>
    )
  }

  return <SettingsDashboard />
}
