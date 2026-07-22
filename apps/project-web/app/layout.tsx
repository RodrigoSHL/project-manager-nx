import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AppProviders } from "@/components/app-providers"

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
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
