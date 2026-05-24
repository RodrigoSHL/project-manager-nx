import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { WorkspaceProvider } from "@/contexts/workspace-context"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ProjectHub - Gestión de Proyectos",
  description: "Sistema de gestión de proyectos empresariales",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <WorkspaceProvider>{children}</WorkspaceProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
