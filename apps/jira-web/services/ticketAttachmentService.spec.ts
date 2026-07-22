import { authenticatedFetch } from '@/lib/api'
import {
  MAX_TICKET_ATTACHMENT_SIZE,
  deleteTicketAttachment,
  listTicketAttachments,
  uploadTicketAttachment,
} from './ticketAttachmentService'

jest.mock('@/lib/api', () => ({ authenticatedFetch: jest.fn() }))

const mockedFetch = jest.mocked(authenticatedFetch)
const attachment = {
  id: '10e98bc8-1e83-4dc8-bb29-d390a52c6684',
  application: 'jira-web',
  ownerType: 'ticket',
  ownerId: '8a312bd4-91ad-4d56-957f-c47c25f63e4c',
  originalName: 'evidencia.pdf',
  mimeType: 'application/pdf',
  size: 128,
  metadata: { category: 'ticket-attachment', projectId: 'project-1' },
  createdAt: '2026-07-22T10:00:00.000Z',
  updatedAt: '2026-07-22T10:00:00.000Z',
}

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response
}

describe('jira-web ticket attachment service', () => {
  beforeEach(() => mockedFetch.mockReset())

  it('lists files scoped to the project and ticket', async () => {
    mockedFetch.mockResolvedValue(response([attachment]))

    await expect(listTicketAttachments('project-1', 'ticket-1')).resolves.toEqual([attachment])
    expect(mockedFetch).toHaveBeenCalledWith(
      '/api/storage/files?application=jira-web&ownerType=ticket&ownerId=ticket-1&projectId=project-1',
      { cache: 'no-store' },
    )
  })

  it('uploads multipart data without overriding its content type', async () => {
    mockedFetch.mockResolvedValue(response(attachment, 201))
    const file = new File(['pdf'], 'evidencia.pdf', { type: 'application/pdf' })

    await expect(uploadTicketAttachment('project-1', 'ticket-1', 'WEB-1', file)).resolves.toEqual(attachment)
    const [, init] = mockedFetch.mock.calls[0]
    const form = init?.body as FormData
    expect(init).toMatchObject({ method: 'POST' })
    expect(init?.headers).toBeUndefined()
    expect(form.get('file')).toBe(file)
    expect(form.get('application')).toBe('jira-web')
    expect(form.get('ownerType')).toBe('ticket')
    expect(form.get('ownerId')).toBe('ticket-1')
    expect(form.get('metadata')).toBe(JSON.stringify({ projectId: 'project-1', ticketKey: 'WEB-1' }))
  })

  it('rejects files larger than 10 MB before calling the API', async () => {
    const file = new File([new Uint8Array(MAX_TICKET_ATTACHMENT_SIZE + 1)], 'large.pdf', {
      type: 'application/pdf',
    })

    await expect(uploadTicketAttachment('project-1', 'ticket-1', 'WEB-1', file)).rejects.toThrow('10 MB')
    expect(mockedFetch).not.toHaveBeenCalled()
  })

  it('deletes an attachment by id', async () => {
    mockedFetch.mockResolvedValue(response(undefined, 204))
    await expect(deleteTicketAttachment(attachment.id)).resolves.toBeUndefined()
    expect(mockedFetch).toHaveBeenCalledWith(`/api/storage/files/${attachment.id}`, { method: 'DELETE' })
  })
})
