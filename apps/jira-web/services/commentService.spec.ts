import { authenticatedFetch } from '@/lib/api'
import {
  createTicketComment,
  deleteTicketComment,
  getTicketComments,
  updateTicketComment,
} from './commentService'

jest.mock('@/lib/api', () => ({
  authenticatedFetch: jest.fn(),
}))

const mockedFetch = jest.mocked(authenticatedFetch)

const comment = {
  id: 'comment-1',
  ticketId: 'ticket-1',
  authorId: 'user-1',
  body: 'Comentario de prueba',
  createdAt: '2026-07-22T10:00:00.000Z',
  updatedAt: '2026-07-22T10:00:00.000Z',
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response
}

describe('jira-web comment service', () => {
  beforeEach(() => {
    mockedFetch.mockReset()
  })

  it('lists comments for a ticket', async () => {
    mockedFetch.mockResolvedValue(jsonResponse([comment]))

    await expect(getTicketComments('project-1', 'ticket-1')).resolves.toEqual([comment])
    expect(mockedFetch).toHaveBeenCalledWith(
      '/api/projects/project-1/tickets/ticket-1/comments',
      { cache: 'no-store' },
    )
  })

  it('creates a comment using only its body', async () => {
    mockedFetch.mockResolvedValue(jsonResponse(comment, 201))

    await expect(createTicketComment('project-1', 'ticket-1', comment.body)).resolves.toEqual(comment)
    expect(mockedFetch).toHaveBeenCalledWith(
      '/api/projects/project-1/tickets/ticket-1/comments',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: comment.body }),
      },
    )
  })

  it('updates a comment using its resource URL', async () => {
    mockedFetch.mockResolvedValue(jsonResponse({ ...comment, body: 'Editado' }))

    await updateTicketComment('project-1', 'ticket-1', comment.id, 'Editado')
    expect(mockedFetch).toHaveBeenCalledWith(
      '/api/projects/project-1/tickets/ticket-1/comments/comment-1',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: 'Editado' }),
      },
    )
  })

  it('deletes a comment using its resource URL', async () => {
    mockedFetch.mockResolvedValue(jsonResponse(undefined, 204))

    await expect(deleteTicketComment('project-1', 'ticket-1', comment.id)).resolves.toBeUndefined()
    expect(mockedFetch).toHaveBeenCalledWith(
      '/api/projects/project-1/tickets/ticket-1/comments/comment-1',
      { method: 'DELETE' },
    )
  })
})
