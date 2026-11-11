'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  AtSign,
  Bell,
  BellOff,
  Check,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  markNotificationRead,
  type JiraNotification,
  type NotificationFilter,
} from '@/lib/notifications'
import { buildTicketPageHref } from '@/lib/ticket-link'
import { cn } from '@/lib/utils'

const dateFormat = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function NotificationFilters({
  value,
  onChange,
}: {
  value: NotificationFilter
  onChange: (value: NotificationFilter) => void
}) {
  return (
    <div
      role="group"
      aria-label="Filtrar notificaciones"
      className="inline-flex w-fit gap-1 rounded-xl bg-muted p-1"
    >
      {(['all', 'unread'] as const).map((status) => (
        <Button
          key={status}
          variant="ghost"
          size="sm"
          aria-pressed={value === status}
          className="h-8 rounded-lg px-3 text-muted-foreground aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm"
          onClick={() => onChange(status)}
        >
          {status === 'all' ? 'Todas' : 'Sin leer'}
        </Button>
      ))}
    </div>
  )
}

export function NotificationUnreadBadge({ count }: { count?: number }) {
  if (!count) return null
  return (
    <span className="w-fit rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-brand-foreground">
      {count} sin leer
    </span>
  )
}

function NotificationItem({
  item,
  onRead,
  onNavigate,
  compact,
}: {
  item: JiraNotification
  onRead: () => void
  onNavigate?: () => void
  compact?: boolean
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)
  const errorId = useId()
  const unread = !item.readAt
  const date = new Date(item.createdAt)
  const mention = item.type === 'comment.mention'
  const Icon = mention ? AtSign : Bell
  const ticketHref = item.ticketId
    ? buildTicketPageHref(item.projectId, item.ticketId, item.commentId)
    : null

  async function markRead() {
    if (!unread || pending) return
    setPending(true)
    setError(false)
    try {
      await markNotificationRead(item)
      onRead()
    } catch {
      setError(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <li
      className={cn(
        'flex gap-3 rounded-xl border p-3 transition-colors sm:p-4',
        unread
          ? 'border-primary/20 bg-primary/5 hover:bg-primary/10'
          : 'border-border/70 bg-card hover:bg-muted/40'
      )}
    >
      <div
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-xl',
          unread
            ? 'bg-primary/10 text-brand-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        <Icon aria-hidden className="size-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {item.projectName && (
            <span className="max-w-full truncate">{item.projectName}</span>
          )}
          {item.ticketKey && (
            <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium text-foreground">
              {item.ticketKey}
            </span>
          )}
        </div>
        <h3 className="flex items-baseline gap-2 text-sm font-semibold leading-snug">
          {unread && (
            <span className="size-1.5 shrink-0 rounded-full bg-primary">
              <span className="sr-only">Sin leer</span>
            </span>
          )}
          <span className="min-w-0 break-words">{item.title}</span>
        </h3>
        <p
          className={cn(
            'whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground',
            compact && 'line-clamp-2'
          )}
        >
          {item.body}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs">
          {!Number.isNaN(date.getTime()) && (
            <time dateTime={item.createdAt} className="text-muted-foreground">
              {dateFormat.format(date)}
            </time>
          )}
          {ticketHref && (
            <Link
              href={ticketHref}
              onNavigate={() => {
                void markRead()
                onNavigate?.()
              }}
              className="inline-flex items-center gap-1 rounded font-medium text-brand-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring"
            >
              {item.commentId ? 'Ver comentario' : 'Abrir ticket'}{' '}
              <ArrowUpRight aria-hidden className="size-3" />
            </Link>
          )}
        </div>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-destructive">
            No se pudo marcar como leída.
          </p>
        )}
      </div>
      {unread && (
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 rounded-lg text-muted-foreground"
          aria-label={`Marcar como leída: ${item.title}`}
          aria-describedby={error ? errorId : undefined}
          title="Marcar como leída"
          disabled={pending}
          onClick={() => void markRead()}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
        </Button>
      )}
    </li>
  )
}

export function NotificationList({
  items,
  loading,
  error,
  status,
  refresh,
  onNavigate,
  compact,
}: {
  items: JiraNotification[]
  loading: boolean
  error?: string
  status: NotificationFilter
  refresh: () => void
  onNavigate?: () => void
  compact?: boolean
}) {
  if (loading)
    return (
      <div
        className="space-y-2"
        role="status"
        aria-label="Cargando notificaciones"
      >
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-20 rounded-xl" />
        ))}
      </div>
    )
  if (error)
    return (
      <div
        role="alert"
        className="space-y-3 rounded-xl border bg-card p-6 text-center"
      >
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button size="sm" variant="outline" onClick={refresh}>
          Reintentar
        </Button>
      </div>
    )
  if (!items.length)
    return (
      <div className="grid place-items-center gap-3 rounded-xl border border-dashed bg-muted/20 px-4 py-10 text-center">
        <div className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <BellOff aria-hidden className="size-5" />
        </div>
        <p className="text-sm font-medium">
          {status === 'unread'
            ? 'Estás al día'
            : 'Aún no tienes notificaciones'}
        </p>
      </div>
    )
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <NotificationItem
          key={item.id}
          item={item}
          onRead={refresh}
          onNavigate={onNavigate}
          compact={compact}
        />
      ))}
    </ul>
  )
}
