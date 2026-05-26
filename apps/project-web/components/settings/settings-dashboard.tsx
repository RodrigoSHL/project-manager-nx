"use client"

import * as React from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNavbar } from "@/components/top-navbar"
import { ThemeProvider } from "@/components/theme-provider"
import { Building2, Users, Shield, Bell, Palette } from "lucide-react"
import { cn } from "@/lib/utils"
import { WorkspacesTab } from "./workspaces-tab"
import { UsersTab } from "./users-tab"

const tabs = [
  { id: "workspaces", label: "Workspaces", icon: Building2, description: "Gestiona equipos y organización" },
  { id: "users", label: "Usuarios", icon: Users, description: "Administra los usuarios del sistema" },
  { id: "roles", label: "Roles y Permisos", icon: Shield, description: "Próximamente", disabled: true },
  { id: "notifications", label: "Notificaciones", icon: Bell, description: "Próximamente", disabled: true },
  { id: "appearance", label: "Apariencia", icon: Palette, description: "Próximamente", disabled: true },
]

export function SettingsDashboard() {
  const [activeTab, setActiveTab] = React.useState("workspaces")

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <TopNavbar />
          <div className="flex flex-1 flex-col gap-0 min-h-screen">
            {/* Header */}
            <div className="border-b bg-background px-8 pt-8 pb-0">
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Administra workspaces, usuarios y las preferencias del sistema.
                </p>
              </div>
              {/* Tab nav */}
              <nav className="flex gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => !tab.disabled && setActiveTab(tab.id)}
                    disabled={tab.disabled}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors",
                      activeTab === tab.id
                        ? "border-primary text-primary bg-primary/5"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      tab.disabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                    {tab.disabled && (
                      <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                        Pronto
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 px-8 py-8">
              {activeTab === "workspaces" && <WorkspacesTab />}
              {activeTab === "users" && <UsersTab />}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  )
}
