'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  NotificationFilters,
  NotificationList,
  NotificationUnreadBadge,
} from '@/components/notification-inbox'
import { useNotificationInbox } from '@/contexts/notifications-context'
import type { NotificationFilter } from '@/lib/notifications'

const pageSize = 20

export default function NotificationsPage() {
  const [status, setStatus] = useState<NotificationFilter>('all')
  const [page, setPage] = useState(1)
  const { inbox, loading, error, refresh } = useNotificationInbox(
    status,
    page,
    pageSize
  )
  const pages = Math.max(page, Math.ceil((inbox?.total ?? 0) / pageSize))

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-muted/15">
      <section
        className="mx-auto w-full max-w-4xl px-4 pb-10 pt-5 sm:px-8 sm:pt-8"
        aria-labelledby="notifications-title"
      >
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-5 text-muted-foreground"
          asChild
        >
          <Link href="/">
            <ArrowLeft aria-hidden className="size-4" />
            Volver al tablero
          </Link>
        </Button>
        <header className="mb-5 flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-brand-foreground sm:size-14">
            <Bell aria-hidden className="size-6" />
          </span>
          <div className="min-w-0">
            <h1
              id="notifications-title"
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Notificaciones
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Menciones de tus proyectos de Jira.
            </p>
          </div>
          <div className="ml-auto">
            <NotificationUnreadBadge count={inbox?.unreadCount} />
          </div>
        </header>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <NotificationFilters
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
          />
          {inbox && (
            <span className="text-xs text-muted-foreground">
              {inbox.total}{' '}
              {inbox.total === 1 ? 'notificación' : 'notificaciones'}
            </span>
          )}
        </div>
        <NotificationList
          items={inbox?.items ?? []}
          loading={loading}
          error={error}
          status={status}
          refresh={refresh}
        />
        {pages > 1 && (
          <nav
            aria-label="Páginas de notificaciones"
            className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-4"
          >
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft aria-hidden className="size-4" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!inbox || page >= pages}
              onClick={() => setPage(page + 1)}
            >
              Siguiente
              <ChevronRight aria-hidden className="size-4" />
            </Button>
          </nav>
        )}
      </section>
    </div>
  )
}
