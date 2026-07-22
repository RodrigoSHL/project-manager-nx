'use client'

import type React from 'react'
import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/contexts/auth-context'
import { WorkspaceProvider } from '@/contexts/workspace-context'
import { ThemeProvider } from '@/components/theme-provider'

const PUBLIC_ROUTES = ['/login', '/portal']

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublicRoute = PUBLIC_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`),
  )

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {isPublicRoute ? (
        children
      ) : (
        <AuthProvider>
          <WorkspaceProvider>{children}</WorkspaceProvider>
        </AuthProvider>
      )}
    </ThemeProvider>
  )
}
