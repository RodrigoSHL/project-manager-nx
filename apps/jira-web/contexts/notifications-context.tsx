'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchInbox,
  type JiraInbox,
  type NotificationFilter,
} from '@/lib/notifications'

const NotificationsContext = createContext<{
  revision: number
  refresh: () => void
} | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [revision, setRevision] = useState(0)
  const refresh = useCallback(() => setRevision((value) => value + 1), [])

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    const timer = window.setInterval(refreshWhenVisible, 60000)
    window.addEventListener('focus', refreshWhenVisible)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refreshWhenVisible)
    }
  }, [refresh])

  return (
    <NotificationsContext.Provider value={{ revision, refresh }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotificationInbox(
  status: NotificationFilter,
  page: number,
  limit: number,
  enabled = true
) {
  const context = useContext(NotificationsContext)
  if (!context) throw new Error('NotificationsProvider is required')
  const { revision, refresh } = context
  const key = `${status}:${page}:${limit}`
  const [result, setResult] = useState<{
    key: string
    inbox?: JiraInbox
    error?: string
  }>()

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    void fetchInbox(status, page, limit, controller.signal)
      .then((inbox) => {
        if (!controller.signal.aborted) setResult({ key, inbox })
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setResult({ key, error: 'No se pudieron cargar tus notificaciones.' })
      })
    return () => controller.abort()
  }, [status, page, limit, enabled, key, revision])

  const current = result?.key === key ? result : undefined
  return {
    inbox: current?.inbox,
    error: current?.error,
    loading: !current,
    refresh,
  }
}
