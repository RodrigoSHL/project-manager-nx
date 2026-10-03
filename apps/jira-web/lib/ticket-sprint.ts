import type { ApiTicket } from '@/types/project'

export function getTicketSprintUpdate(ticket: ApiTicket, sprintId: string | null) {
  return {
    sprintId,
    status: sprintId === null ? 'backlog' as const : ticket.status === 'backlog' ? 'todo' as const : ticket.status,
  }
}
