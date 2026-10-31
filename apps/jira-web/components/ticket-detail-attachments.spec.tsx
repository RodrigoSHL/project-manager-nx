import * as React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TicketDetail } from './ticket-detail'
import { createTicketComment, getTicketComments } from '@/services/commentService'
import { getTicketAttachmentContent, listTicketAttachments, uploadTicketAttachment } from '@/services/ticketAttachmentService'
import type { ApiComment, ApiTicket, ApiTicketAttachment } from '@/types/project'

jest.mock('@/contexts/auth-context', () => ({ useAuth: () => ({ user: { userId: 'user-1', name: 'Usuario' } }) }))
jest.mock('@/services/commentService', () => ({ getTicketComments: jest.fn(), createTicketComment: jest.fn(), updateTicketComment: jest.fn(), deleteTicketComment: jest.fn() }))
jest.mock('@/services/ticketAttachmentService', () => ({ ...jest.requireActual('@/services/ticketAttachmentService'), listTicketAttachments: jest.fn(), uploadTicketAttachment: jest.fn(), getTicketAttachmentContent: jest.fn() }))

it('shows a published file in both the comment and the ticket, persists across reload and opens the shared viewer', async () => {
  Element.prototype.scrollTo = jest.fn()
  URL.createObjectURL = jest.fn().mockReturnValue('blob:content')
  URL.revokeObjectURL = jest.fn()
  const ticket: ApiTicket = {
    id: 'ticket-1', key: 'P-1', projectId: 'project-1', title: 'Ticket', type: 'task', status: 'todo', priority: 'medium', labels: [],
    sprintId: null, description: null, acceptanceCriteria: null, assigneeId: null,
    epicId: null, reporterId: null, storyPoints: null, dueDate: null,
    createdAt: '2026-10-31T12:00:00Z', updatedAt: '2026-10-31T12:00:00Z',
  }
  const attachment = { id: 'file-1', originalName: 'captura.png', mimeType: 'image/png', size: 128, createdAt: ticket.createdAt } as ApiTicketAttachment
  const comment = { id: 'comment-1', ticketId: ticket.id, authorId: 'user-1', body: 'Evidencia', attachmentIds: ['file-1'], createdAt: ticket.createdAt, updatedAt: ticket.createdAt } as ApiComment
  jest.mocked(getTicketComments).mockResolvedValue([])
  jest.mocked(listTicketAttachments).mockResolvedValue([])
  jest.mocked(uploadTicketAttachment).mockResolvedValue(attachment)
  jest.mocked(createTicketComment).mockResolvedValue(comment)
  jest.mocked(getTicketAttachmentContent).mockResolvedValue(new Blob(['image'], { type: 'image/png' }))
  const props = { ticket, projectId: 'project-1', open: true, canWrite: false, onClose: jest.fn(), onUpdated: jest.fn(), onDeleted: jest.fn(), onSelectTicket: jest.fn() }
  const view = render(<TicketDetail {...props} />)
  await screen.findByText('Este ticket todavía no tiene archivos adjuntos.')
  fireEvent.change(screen.getByRole('textbox', { name: 'Escribe un comentario...' }), { target: { value: 'Evidencia' } })
  fireEvent.change(screen.getByLabelText('Archivos del comentario'), { target: { files: [new File(['image'], 'captura.png', { type: 'image/png' })] } })
  fireEvent.click(screen.getByRole('button', { name: 'Publicar' }))
  await waitFor(() => expect(screen.getAllByRole('button', { name: 'Ver captura.png' })).toHaveLength(2))
  expect(screen.getByRole('heading', { name: 'Archivos (1)' })).toBeInTheDocument()
  expect(screen.getByRole('list', { name: 'Archivos del comentario' })).toHaveTextContent('captura.png')
  view.unmount()
  jest.mocked(getTicketComments).mockResolvedValue([comment])
  jest.mocked(listTicketAttachments).mockResolvedValue([attachment])
  render(<TicketDetail {...props} />)
  await waitFor(() => expect(screen.getAllByRole('button', { name: 'Ver captura.png' })).toHaveLength(2))
  fireEvent.click(screen.getAllByRole('button', { name: 'Ver captura.png' })[1])
  expect(await screen.findByRole('button', { name: 'Descargar archivo' })).toBeEnabled()
  expect(await screen.findByRole('img', { name: 'captura.png' })).toHaveAttribute('src', 'blob:content')
})
