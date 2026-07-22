"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { AuthProvider } from "@/contexts/auth-context"
import { WorkspaceProvider } from "@/contexts/workspace-context"
import { ThemeProvider } from "@/components/theme-provider"

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {pathname === "/login" ? (
        children
      ) : (
        <AuthProvider>
          <WorkspaceProvider>{children}</WorkspaceProvider>
        </AuthProvider>
      )}
    </ThemeProvider>
  )
}
