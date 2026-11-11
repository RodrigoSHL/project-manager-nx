'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  NotificationFilters,
  NotificationList,
  NotificationUnreadBadge,
} from '@/components/notification-inbox'
import { useNotificationInbox } from '@/contexts/notifications-context'
import type { NotificationFilter } from '@/lib/notifications'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<NotificationFilter>('all')
  const { inbox: badge, refresh } = useNotificationInbox('all', 1, 1, !open)
  const { inbox, loading, error } = useNotificationInbox(status, 1, 6, open)
  const unreadCount =
    (open ? inbox?.unreadCount ?? badge?.unreadCount : badge?.unreadCount) ?? 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9"
          aria-label={
            unreadCount
              ? `Notificaciones, ${unreadCount} sin leer`
              : 'Notificaciones'
          }
        >
          <Bell className="size-4" aria-hidden />
          {unreadCount > 0 && (
            <span
              aria-hidden
              className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground ring-2 ring-background"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(85dvh,46rem)] max-w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl sm:max-w-[34rem]">
        <div className="shrink-0 border-b bg-muted/25 px-4 pb-4 pt-5 sm:px-6">
          <div className="flex items-center gap-3 pr-8">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-brand-foreground">
              <Bell className="size-5" aria-hidden />
            </span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <DialogTitle className="text-xl tracking-tight">
                Notificaciones
              </DialogTitle>
              <NotificationUnreadBadge count={unreadCount} />
            </div>
            <DialogDescription className="sr-only">
              Notificaciones recientes de tus proyectos de Jira
            </DialogDescription>
          </div>
          <div className="mt-4">
            <NotificationFilters value={status} onChange={setStatus} />
          </div>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-4">
          <NotificationList
            items={inbox?.items ?? []}
            loading={loading}
            error={error}
            status={status}
            refresh={refresh}
            onNavigate={() => setOpen(false)}
            compact
          />
        </div>
        <div className="shrink-0 border-t bg-muted/25 px-4 py-3 sm:px-6">
          <Button
            variant="ghost"
            className="w-full justify-between text-brand-foreground"
            asChild
          >
            <Link href="/notifications" onNavigate={() => setOpen(false)}>
              Ver todas las notificaciones{' '}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
