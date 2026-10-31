import * as React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TicketCommentComposer } from './ticket-comment-composer'
import { createTicketComment } from '@/services/commentService'
import { MAX_TICKET_ATTACHMENT_SIZE, uploadTicketAttachment } from '@/services/ticketAttachmentService'
import type { ApiComment, ApiTicketAttachment } from '@/types/project'

jest.mock('@/services/commentService', () => ({ createTicketComment: jest.fn() }))
jest.mock('@/services/ticketAttachmentService', () => ({
  ...jest.requireActual('@/services/ticketAttachmentService'), uploadTicketAttachment: jest.fn(),
}))

const image = new File(['image'], 'captura.png', { type: 'image/png' })
const pdf = new File(['pdf'], 'informe.pdf', { type: 'application/pdf' })
const first = { id: 'file-1', originalName: image.name } as ApiTicketAttachment
const second = { id: 'file-2', originalName: pdf.name } as ApiTicketAttachment
const comment = { id: 'comment-1', body: '', attachmentIds: ['file-1', 'file-2'] } as ApiComment
const props = () => ({ projectId: 'project-1', ticketId: 'ticket-1', ticketKey: 'P-1', teamMembers: [], onCreated: jest.fn(), onAttachmentUploaded: jest.fn() })
const select = (files: File[]) => fireEvent.change(screen.getByLabelText('Archivos del comentario'), { target: { files } })
beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(createTicketComment).mockResolvedValue(comment)
})

it('queues multiple files, then publishes without text and reports each upload to the ticket', async () => {
  const callbacks = props()
  jest.mocked(uploadTicketAttachment).mockResolvedValueOnce(first).mockResolvedValueOnce(second)
  render(<TicketCommentComposer {...callbacks} />)
  select([image, pdf])
  expect(uploadTicketAttachment).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Publicar' }))
  await waitFor(() => expect(callbacks.onCreated).toHaveBeenCalledWith(comment))
  expect(createTicketComment).toHaveBeenCalledWith('project-1', 'ticket-1', '', undefined, ['file-1', 'file-2'])
  expect(callbacks.onAttachmentUploaded.mock.calls).toEqual([[first], [second]])
  expect(screen.queryByRole('list', { name: 'Archivos seleccionados' })).not.toBeInTheDocument()
})

it('retries a failed upload without uploading successful files again or duplicating the comment', async () => {
  const callbacks = props()
  jest.mocked(uploadTicketAttachment).mockResolvedValueOnce(first).mockRejectedValueOnce(new Error('Subida fallida')).mockResolvedValueOnce(second)
  render(<TicketCommentComposer {...callbacks} />)
  select([image, pdf])
  fireEvent.click(screen.getByRole('button', { name: 'Publicar' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Subida fallida')
  expect(createTicketComment).not.toHaveBeenCalled()
  expect(screen.getByText(image.name)).toBeInTheDocument()
  expect(screen.getByText(pdf.name)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Publicar' }))
  await waitFor(() => expect(callbacks.onCreated).toHaveBeenCalled())
  expect(uploadTicketAttachment).toHaveBeenCalledTimes(3)
  expect(jest.mocked(uploadTicketAttachment).mock.calls.map(call => call[3].name)).toEqual([image.name, pdf.name, pdf.name])
  expect(createTicketComment).toHaveBeenCalledTimes(1)
})

it('keeps the text and uploaded file references if publishing fails', async () => {
  jest.mocked(uploadTicketAttachment).mockResolvedValue(first)
  jest.mocked(createTicketComment).mockRejectedValueOnce(new Error('Comentario fallido')).mockResolvedValueOnce(comment)
  render(<TicketCommentComposer {...props()} parentCommentId="parent-1" />)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Mi respuesta' } })
  select([image])
  fireEvent.click(screen.getByRole('button', { name: 'Responder' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Comentario fallido')
  expect(screen.getByRole('textbox')).toHaveValue('Mi respuesta')
  fireEvent.click(screen.getByRole('button', { name: 'Responder' }))
  await waitFor(() => expect(createTicketComment).toHaveBeenCalledTimes(2))
  expect(createTicketComment).toHaveBeenLastCalledWith('project-1', 'ticket-1', 'Mi respuesta', 'parent-1', ['file-1'])
  expect(uploadTicketAttachment).toHaveBeenCalledTimes(1)
})

it('removes draft files and rejects oversized or excessive selections before uploading', () => {
  render(<TicketCommentComposer {...props()} />)
  select([image])
  fireEvent.click(screen.getByRole('button', { name: `Quitar ${image.name} del comentario` }))
  expect(screen.getByRole('button', { name: 'Publicar' })).toBeDisabled()
  const large = new File(['x'], 'grande.pdf')
  Object.defineProperty(large, 'size', { value: MAX_TICKET_ATTACHMENT_SIZE + 1 })
  select([large])
  expect(screen.getByRole('alert')).toHaveTextContent('10 MB')
  select(Array(11).fill(image))
  expect(screen.getByRole('alert')).toHaveTextContent('hasta 10 archivos')
  expect(uploadTicketAttachment).not.toHaveBeenCalled()
})

it('blocks duplicate submissions while uploading with the keyboard shortcut', async () => {
  let resolve!: (file: ApiTicketAttachment) => void
  jest.mocked(uploadTicketAttachment).mockImplementation(() => new Promise(done => { resolve = done }))
  render(<TicketCommentComposer {...props()} />)
  select([image])
  const textarea = screen.getByRole('textbox')
  fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true })
  fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true })
  expect(uploadTicketAttachment).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('button', { name: 'Publicando…' })).toBeDisabled()
  await act(async () => resolve(first))
  expect(createTicketComment).toHaveBeenCalledTimes(1)
})
