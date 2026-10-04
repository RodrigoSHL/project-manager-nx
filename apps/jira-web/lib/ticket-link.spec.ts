import { parseTicketLink } from './ticket-link'

describe('ticket links', () => {
  const id = '00000000-0000-4000-8000-000000000001'
  const search = new URLSearchParams({ workspaceId: id, projectId: id, ticketId: id, commentId: id }).toString()
  it('parses the workspace, project, ticket and comment after a login redirect', () => {
    expect(parseTicketLink(`?${search}`)).toEqual({ workspaceId: id, projectId: id, ticketId: id, commentId: id })
  })
  it.each(['', '?ticketId=../../other', search.replace('commentId=', 'missing='), search.replace('ticketId='+id, 'ticketId=invalid')])('ignores incomplete or malformed links', value => {
    expect(parseTicketLink(value)).toBeNull()
  })
})
