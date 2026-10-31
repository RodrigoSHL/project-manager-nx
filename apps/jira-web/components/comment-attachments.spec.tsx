import * as React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CommentAttachments } from './comment-attachments'
import { getTicketAttachmentContent } from '@/services/ticketAttachmentService'
import type { ApiTicketAttachment } from '@/types/project'

jest.mock('@/services/ticketAttachmentService', () => ({ getTicketAttachmentContent: jest.fn() }))
const image = { id: 'file-1', originalName: 'captura.png', mimeType: 'image/png', size: 2048 } as ApiTicketAttachment
beforeEach(() => {
  jest.resetAllMocks()
  URL.createObjectURL = jest.fn().mockReturnValue('blob:thumbnail')
  URL.revokeObjectURL = jest.fn()
  jest.mocked(getTicketAttachmentContent).mockResolvedValue(new Blob(['image']))
})

it('shows an authenticated image thumbnail and connects preview and download to the same file', async () => {
  const onPreview = jest.fn()
  const onDownload = jest.fn()
  const view = render(<CommentAttachments ids={['file-1']} attachments={[image]} loading={false} onPreview={onPreview} onDownload={onDownload} />)
  expect(await screen.findByRole('img')).toHaveAttribute('src', 'blob:thumbnail')
  fireEvent.click(screen.getByRole('button', { name: 'Ver captura.png' }))
  fireEvent.click(screen.getByRole('button', { name: 'Descargar captura.png' }))
  expect(onPreview).toHaveBeenCalledWith(image)
  expect(onDownload).toHaveBeenCalledWith(image)
  view.unmount()
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:thumbnail')
})

it('offers PDF preview and download without trying to load an image thumbnail', () => {
  const pdf = { ...image, mimeType: 'application/pdf', originalName: 'informe.pdf' }
  render(<CommentAttachments ids={['file-1', 'deleted']} attachments={[pdf]} loading={false} onPreview={jest.fn()} onDownload={jest.fn()} />)
  expect(screen.getByRole('button', { name: 'Ver informe.pdf' })).toBeEnabled()
  expect(screen.getByText('Archivo no disponible.')).toBeInTheDocument()
  expect(getTicketAttachmentContent).not.toHaveBeenCalled()
})

it('retains access to a file even if its thumbnail fails to load', async () => {
  jest.mocked(getTicketAttachmentContent).mockRejectedValue(new Error('Failed'))
  render(<CommentAttachments ids={['file-1']} attachments={[image]} loading={false} onPreview={jest.fn()} onDownload={jest.fn()} />)
  await waitFor(() => expect(getTicketAttachmentContent).toHaveBeenCalled())
  expect(screen.getByRole('button', { name: 'Ver captura.png' })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Descargar captura.png' })).toBeEnabled()
})
