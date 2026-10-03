import { getTicketSprintUpdate } from './ticket-sprint'
import type { ApiTicket } from '@/types/project'

describe('ticket sprint assignment', () => {
  it('moves backlog work to To Do so it appears on the sprint board', () => {
    expect(getTicketSprintUpdate({ status: 'backlog' } as ApiTicket, 'sprint-1'))
      .toEqual({ sprintId: 'sprint-1', status: 'todo' })
  })

  it.each(['todo', 'in_progress', 'in_review', 'done', 'cancelled'] as const)(
    'preserves %s when assigning a sprint', status => {
      expect(getTicketSprintUpdate({ status } as ApiTicket, 'sprint-1'))
        .toEqual({ sprintId: 'sprint-1', status })
    },
  )

  it('returns a removed ticket to the backlog', () => {
    expect(getTicketSprintUpdate({ status: 'in_progress' } as ApiTicket, null))
      .toEqual({ sprintId: null, status: 'backlog' })
  })
})
