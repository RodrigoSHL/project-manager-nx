"use client"

import * as React from "react"
import { Bell, Moon, Sun, Settings, LogOut, User, Shield, Folder } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/components/theme-provider"
import { NotificationsDialog } from "./notifications-dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"

// Datos de ejemplo del usuario
const userData = {
  name: "Ana García",
  email: "ana.garcia@empresa.com",
  role: "Tech Lead",
  avatar: "/placeholder.svg?height=32&width=32",
  initials: "AG",
}

// Datos de ejemplo de notificaciones
const notifications = [
  {
    id: "1",
    title: "Nuevo despliegue completado",
    description: "Sistema de Gestión v2.1.3 desplegado exitosamente",
    time: "hace 5 min",
    read: false,
    type: "success" as const,
  },
  {
    id: "2",
    title: "Revisión de código pendiente",
    description: "PR #234 requiere tu revisión en app-mobile",
    time: "hace 15 min",
    read: false,
    type: "info" as const,
  },
  {
    id: "3",
    title: "Error en producción",
    description: "Analytics Platform reporta errores 500",
    time: "hace 1 hora",
    read: true,
    type: "error" as const,
  },
  {
    id: "4",
    title: "Reunión programada",
    description: "Daily standup en 30 minutos",
    time: "hace 2 horas",
    read: true,
    type: "info" as const,
  },
]

export function TopNavbar() {
  const { theme, setTheme } = useTheme()
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleLogout = () => {
    console.log("Cerrando sesión...")
  }

  const handleSettings = () => {
    console.log("Abriendo configuración...")
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left side - Sidebar Trigger, Logo and Breadcrumbs */}
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-2">
          {/* <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Folder className="h-4 w-4" />
          </div> */}
          <span className="font-semibold text-lg">ProjectHub</span>
        </div>
        <div className="text-muted-foreground">
          <span>›</span>
        </div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#" className="text-muted-foreground">
                Proyectos
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Notificaciones */}
        <NotificationsDialog
          notifications={notifications}
          open={isNotificationsOpen}
          onOpenChange={setIsNotificationsOpen}
        >
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount}
              </Badge>
            )}
            <span className="sr-only">Notificaciones {unreadCount > 0 && `(${unreadCount} sin leer)`}</span>
          </Button>
        </NotificationsDialog>

        {/* Toggle modo oscuro */}
        <Button variant="ghost" size="sm" onClick={toggleTheme}>
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Cambiar tema</span>
        </Button>

        {/* Avatar y menú de usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userData.avatar || "/placeholder.svg"} alt={userData.name} />
                <AvatarFallback>{userData.initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userData.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{userData.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    {userData.role}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSettings}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Mi Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
