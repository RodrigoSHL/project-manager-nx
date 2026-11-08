import * as React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { TicketDetail } from './ticket-detail'
import { getTicketComments } from '@/services/commentService'
import { listTicketAttachments } from '@/services/ticketAttachmentService'
import type { ApiTicket } from '@/types/project'

jest.mock('@/contexts/auth-context', () => ({ useAuth: () => ({ user: { userId: 'user-1', name: 'Usuario' } }) }))
jest.mock('@/services/commentService', () => ({ getTicketComments: jest.fn() }))
jest.mock('@/services/ticketAttachmentService', () => ({ listTicketAttachments: jest.fn(), TICKET_ATTACHMENT_ACCEPT: '.pdf' }))
const story: ApiTicket = {
  id: 'story-1', projectId: 'project-1', key: 'P-1', title: 'Historia', type: 'story', epicId: 'epic-1', status: 'todo', priority: 'medium', labels: [],
  sprintId: null, description: null, acceptanceCriteria: null, assigneeId: null, reporterId: null, storyPoints: null, dueDate: null,
  createdAt: '2026-10-31', updatedAt: '2026-10-31',
}
const subtask = { ...story, id: 'child-1', type: 'subtask' as const, parentTicketId: story.id, epicId: null, key: 'P-2', title: 'Validar formulario' }
const props = () => ({ projectId: 'project-1', open: true, canWrite: true, tickets: [story, subtask], onClose: jest.fn(), onUpdated: jest.fn(), onDeleted: jest.fn(), onSelectTicket: jest.fn(), onCreateChild: jest.fn() })
beforeEach(() => {
  Element.prototype.scrollTo = jest.fn()
  jest.mocked(getTicketComments).mockResolvedValue([])
  jest.mocked(listTicketAttachments).mockResolvedValue([])
})

it('opens and creates subtasks from the user story detail', async () => {
  const callbacks = props()
  render(<TicketDetail {...callbacks} ticket={story} />)
  fireEvent.click(screen.getByRole('button', { name: /P-2 Validar formulario/ }))
  expect(callbacks.onSelectTicket).toHaveBeenCalledWith(subtask)
  fireEvent.click(screen.getByRole('button', { name: 'Crear subtarea' }))
  expect(callbacks.onCreateChild).toHaveBeenCalledWith(story)
  await screen.findByText('Este ticket todavía no tiene archivos adjuntos.')
})

it('lets a reader navigate to the parent story and keeps the parent selector read-only', async () => {
  const callbacks = props()
  render(<TicketDetail {...callbacks} ticket={subtask} canWrite={false} />)
  expect(screen.getByRole('combobox', { name: 'Historia de usuario' })).toBeDisabled()
  expect(screen.getByRole('combobox', { name: 'Historia de usuario' })).toHaveTextContent('P-1 · Historia')
  fireEvent.click(screen.getByRole('button', { name: 'Ver historia P-1' }))
  expect(callbacks.onSelectTicket).toHaveBeenCalledWith(story)
  expect(screen.queryByRole('button', { name: 'Crear subtarea' })).not.toBeInTheDocument()
  await screen.findByText('Este ticket todavía no tiene archivos adjuntos.')
})

it('links the ticket key in the panel header to its dedicated page', async () => {
  render(<TicketDetail {...props()} ticket={story} />)
  expect(screen.getByRole('link', { name: 'Abrir P-1 en página completa' })).toHaveAttribute('href', '/projects/project-1/tickets/story-1')
  await screen.findByText('Este ticket todavía no tiene archivos adjuntos.')
})

it('renders the full detail as a page without a sheet overlay and keeps child navigation', async () => {
  const callbacks = props()
  render(<TicketDetail {...callbacks} ticket={story} variant="page" />)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 1, name: 'Historia' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Acciones del ticket' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /P-2 Validar formulario/ }))
  expect(callbacks.onSelectTicket).toHaveBeenCalledWith(subtask)
  await screen.findByText('Este ticket todavía no tiene archivos adjuntos.')
})
