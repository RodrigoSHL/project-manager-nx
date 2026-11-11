import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { NotificationBell } from '@/components/notification-bell'
import NotificationsPage from '@/app/notifications/page'
import { NotificationsProvider } from '@/contexts/notifications-context'
import {
  fetchInbox,
  markNotificationRead,
  type JiraNotification,
} from '@/lib/notifications'

jest.mock('@/lib/notifications', () => ({
  fetchInbox: jest.fn(),
  markNotificationRead: jest.fn(),
}))

const item: JiraNotification = {
  id: 'notification',
  projectId: 'project',
  type: 'comment.mention',
  title: 'Ana te mencionó en PM-12',
  body: '¿Puedes revisar este comentario?',
  createdAt: '2026-11-01T12:00:00.000Z',
  readAt: null,
  projectName: 'Planificación',
  ticketKey: 'PM-12',
  ticketId: 'ticket',
  commentId: 'comment',
}

beforeEach(() => {
  jest.clearAllMocks()
  let unread = true
  jest.mocked(fetchInbox).mockImplementation(async (status) => {
    const items =
      status === 'unread' && !unread
        ? []
        : [{ ...item, readAt: unread ? null : '2026-11-01T13:00:00.000Z' }]
    return { items, total: items.length, unreadCount: unread ? 1 : 0 }
  })
  jest.mocked(markNotificationRead).mockImplementation(async () => {
    unread = false
  })
})

it('opens the accessible dialog, links to the comment and updates the badge when read', async () => {
  render(
    <NotificationsProvider>
      <NotificationBell />
    </NotificationsProvider>
  )
  fireEvent.click(
    await screen.findByRole('button', { name: 'Notificaciones, 1 sin leer' })
  )
  const dialog = screen.getByRole('dialog', { name: 'Notificaciones' })
  expect(await within(dialog).findByText(item.title)).toBeInTheDocument()
  expect(
    within(dialog).getByRole('link', { name: 'Ver comentario' })
  ).toHaveAttribute(
    'href',
    '/projects/project/tickets/ticket?commentId=comment'
  )
  expect(
    within(dialog).getByRole('link', { name: 'Ver todas las notificaciones' })
  ).toHaveAttribute('href', '/notifications')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Sin leer' }))
  fireEvent.click(
    await within(dialog).findByRole('button', { name: /Marcar como leída/ })
  )
  await waitFor(() => expect(markNotificationRead).toHaveBeenCalledWith(item))
  expect(await within(dialog).findByText('Estás al día')).toBeInTheDocument()
  fireEvent.keyDown(dialog, { key: 'Escape' })
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(
    await screen.findByRole('button', { name: 'Notificaciones' })
  ).toBeInTheDocument()
})

it('loads the history and retains read items under Todas', async () => {
  render(
    <NotificationsProvider>
      <NotificationsPage />
    </NotificationsProvider>
  )
  expect(await screen.findByText(item.title)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Marcar como leída/ }))
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: /Marcar como leída/ })
    ).not.toBeInTheDocument()
  )
  expect(screen.getByText(item.title)).toBeInTheDocument()
})
