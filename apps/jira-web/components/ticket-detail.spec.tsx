import * as React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TicketDetail } from './ticket-detail'
import { getTicketComments } from '@/services/commentService'
import { listTicketAttachments, uploadTicketAttachment } from '@/services/ticketAttachmentService'
import type { ApiTicket, ApiTicketAttachment } from '@/types/project'

jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: { userId: 'viewer-1', name: 'Viewer', email: 'viewer@example.com', roles: ['user'] } }),
}))
jest.mock('@/services/commentService', () => ({ getTicketComments: jest.fn() }))
jest.mock('@/services/ticketAttachmentService', () => ({
  TICKET_ATTACHMENT_ACCEPT: '.pdf',
  listTicketAttachments: jest.fn(),
  uploadTicketAttachment: jest.fn(),
  deleteTicketAttachment: jest.fn(),
  downloadTicketAttachment: jest.fn(),
}))

it('lets a viewer attach documentation while ticket fields and attachment deletion stay restricted', async () => {
  HTMLElement.prototype.scrollTo = jest.fn()
  jest.mocked(getTicketComments).mockResolvedValue([])
  jest.mocked(listTicketAttachments).mockResolvedValue([])
  const ticket = {
    id: 'ticket-1', projectId: 'project-1', key: 'WEB-1', title: 'Revisar documentación',
    type: 'task', status: 'todo', priority: 'medium', labels: [],
    createdAt: '2026-10-26T12:00:00Z', updatedAt: '2026-10-26T12:00:00Z',
  } as ApiTicket
  const attachment = {
    id: 'file-1', originalName: 'documentacion.pdf', mimeType: 'application/pdf', size: 3,
    createdAt: '2026-10-26T12:00:00Z',
  } as ApiTicketAttachment
  jest.mocked(uploadTicketAttachment).mockResolvedValue(attachment)

  render(<TicketDetail canWrite={false} ticket={ticket} open projectId={ticket.projectId}
    onClose={jest.fn()} onUpdated={jest.fn()} onDeleted={jest.fn()} onSelectTicket={jest.fn()} />)

  expect(screen.getByRole('button', { name: 'Adjuntar' })).toBeEnabled()
  const file = new File(['pdf'], attachment.originalName, { type: attachment.mimeType })
  fireEvent.change(screen.getByLabelText('Adjuntar archivo al ticket'), { target: { files: [file] } })

  await waitFor(() => expect(uploadTicketAttachment).toHaveBeenCalledWith(ticket.projectId, ticket.id, ticket.key, file))
  expect(await screen.findByText(attachment.originalName)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: `Eliminar ${attachment.originalName}` })).not.toBeInTheDocument()
  for (const field of screen.getAllByRole('combobox')) expect(field).toBeDisabled()
})
