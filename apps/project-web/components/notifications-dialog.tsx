"use client"

import * as React from "react"
import { Bell, CheckCircle, AlertCircle, Info, MoreHorizontal } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  title: string
  description: string
  time: string
  read: boolean
  type: "success" | "error" | "info" | "warning"
}

interface NotificationsDialogProps {
  children: React.ReactNode
  notifications: Notification[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "success":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "error":
      return <AlertCircle className="h-4 w-4 text-red-600" />
    case "warning":
      return <AlertCircle className="h-4 w-4 text-yellow-600" />
    case "info":
    default:
      return <Info className="h-4 w-4 text-blue-600" />
  }
}

const getNotificationBg = (type: string, read: boolean) => {
  const baseClasses = read ? "bg-muted/30" : "bg-background"
  switch (type) {
    case "success":
      return cn(baseClasses, "border-l-4 border-l-green-500")
    case "error":
      return cn(baseClasses, "border-l-4 border-l-red-500")
    case "warning":
      return cn(baseClasses, "border-l-4 border-l-yellow-500")
    case "info":
    default:
      return cn(baseClasses, "border-l-4 border-l-blue-500")
  }
}

export function NotificationsDialog({ children, notifications, open, onOpenChange }: NotificationsDialogProps) {
  const [localNotifications, setLocalNotifications] = React.useState(notifications)
  const unreadCount = localNotifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setLocalNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setLocalNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const deleteNotification = (id: string) => {
    setLocalNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones
              </DialogTitle>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} sin leer
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Marcar todas como leídas
              </Button>
            )}
          </div>
          <DialogDescription>Mantente al día con las actualizaciones de tus proyectos</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {localNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">No tienes notificaciones</p>
            </div>
          ) : (
            <div className="space-y-3">
              {localNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 rounded-lg transition-colors",
                    getNotificationBg(notification.type, notification.read),
                    !notification.read && "ring-1 ring-border",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={cn("text-sm font-medium", !notification.read && "font-semibold")}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">{notification.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Opciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!notification.read && (
                              <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                                Marcar como leída
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => deleteNotification(notification.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
