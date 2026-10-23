import * as React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TicketAttachmentViewer } from './ticket-attachment-viewer'
import { downloadTicketAttachment, getTicketAttachmentContent } from '@/services/ticketAttachmentService'
import type { ApiTicketAttachment } from '@/types/project'

jest.mock('@/services/ticketAttachmentService', () => ({
  downloadTicketAttachment: jest.fn(),
  getTicketAttachmentContent: jest.fn(),
}))

const attachment = {
  id: 'file-1', originalName: 'Evidencia de revisión.png', mimeType: 'image/png',
} as ApiTicketAttachment
const content = jest.mocked(getTicketAttachmentContent)

beforeEach(() => {
  jest.resetAllMocks()
  URL.createObjectURL = jest.fn().mockReturnValue('blob:preview')
  URL.revokeObjectURL = jest.fn()
  content.mockResolvedValue(new Blob(['image'], { type: 'image/png' }))
})

it('previews an authenticated image, downloads it and releases the URL on close', async () => {
  const onClose = jest.fn()
  const view = render(<TicketAttachmentViewer attachment={attachment} onClose={onClose} />)
  expect(await screen.findByRole('img')).toHaveAttribute('src', 'blob:preview')
  const signal = content.mock.calls[0][1]!
  expect(content).toHaveBeenCalledWith('file-1', expect.any(AbortSignal))
  fireEvent.click(screen.getByRole('button', { name: 'Descargar archivo' }))
  await waitFor(() => expect(downloadTicketAttachment).toHaveBeenCalledWith('file-1', attachment.originalName))
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
  expect(onClose).toHaveBeenCalled()
  view.unmount()
  expect(signal.aborted).toBe(true)
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
})

it('embeds PDFs with a fallback and always offers download', async () => {
  render(<TicketAttachmentViewer attachment={{ ...attachment, originalName: 'informe.pdf', mimeType: 'application/pdf' }} onClose={jest.fn()} />)
  const pdf = await screen.findByLabelText('Vista previa de informe.pdf')
  expect(pdf).toHaveAttribute('data', 'blob:preview')
  expect(pdf).toHaveAttribute('type', 'application/pdf')
  expect(pdf).toHaveTextContent('Formato no válido para vista previa.')
  expect(screen.getByRole('button', { name: 'Descargar archivo' })).toBeEnabled()
})

it.each(['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/heic', 'text/html', 'image/svg+xml'])(
  'offers download for unsupported %s without embedding its content', mimeType => {
    render(<TicketAttachmentViewer attachment={{ ...attachment, mimeType }} onClose={jest.fn()} />)
    expect(screen.getByText('Formato no válido para vista previa.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Descargar archivo' })).toBeEnabled()
    expect(content).not.toHaveBeenCalled()
  },
)

it('falls back when the browser cannot decode an image', async () => {
  render(<TicketAttachmentViewer attachment={attachment} onClose={jest.fn()} />)
  fireEvent.error(await screen.findByRole('img'))
  expect(screen.getByText('Formato no válido para vista previa.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Descargar archivo' })).toBeEnabled()
})

it('keeps download available after preview failure and shows download errors', async () => {
  content.mockRejectedValue(new Error('No se pudo cargar el archivo.'))
  jest.mocked(downloadTicketAttachment).mockRejectedValue(new Error('Descarga fallida.'))
  render(<TicketAttachmentViewer attachment={attachment} onClose={jest.fn()} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar el archivo.')
  fireEvent.click(screen.getByRole('button', { name: 'Descargar archivo' }))
  expect(await screen.findByText('Descarga fallida.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Descargar archivo' })).toBeEnabled()
})

it('does not create a URL when a pending preview completes after closing', async () => {
  let resolve!: (blob: Blob) => void
  content.mockImplementation(() => new Promise(done => { resolve = done }))
  const view = render(<TicketAttachmentViewer attachment={attachment} onClose={jest.fn()} />)
  expect(screen.getByRole('status')).toHaveTextContent('Cargando vista previa')
  view.unmount()
  await act(async () => resolve(new Blob(['image'])))
  expect(URL.createObjectURL).not.toHaveBeenCalled()
})
