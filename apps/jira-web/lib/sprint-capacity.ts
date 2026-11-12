import type { ApiSprint, ApiTicket } from '@/types/project'

const DAY_MS = 86_400_000
const WEEKDAYS = 5

function sprintDate(date: string | null) {
  return date ? new Date(date.split('T')[0] + 'T00:00:00Z') : null
}

export function formatSprintDate(date: string | null) {
  return sprintDate(date)?.toLocaleDateString('es-CL', {
    month: 'short', day: 'numeric', timeZone: 'UTC',
  }) ?? null
}

export function getSprintCapacity(startDate: string | null, endDate: string | null, weeklyCapacity?: number | null) {
  const start = sprintDate(startDate)
  const end = sprintDate(endDate)
  if (!start || !end || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start > end) {
    return { weekdays: null, points: null }
  }

  const days = (end.getTime() - start.getTime()) / DAY_MS + 1
  let weekdays = Math.floor(days / 7) * WEEKDAYS
  for (let offset = 0; offset < days % 7; offset++) {
    const day = (start.getUTCDay() + offset) % 7
    if (day >= 1 && day <= WEEKDAYS) weekdays++
  }
  const points = weeklyCapacity == null ? null : Math.floor(weeklyCapacity * weekdays / WEEKDAYS)
  return { weekdays, points }
}

export function getSprintPointTotals(sprint: ApiSprint, tickets: ApiTicket[]) {
  let planned = 0
  let completed = 0
  let unestimated = 0
  for (const ticket of tickets) {
    if (ticket.projectId !== sprint.projectId || ticket.sprintId !== sprint.id || ticket.type === 'epic'
      || ticket.status === 'backlog' || ticket.status === 'cancelled') continue

    if (ticket.storyPoints == null) {
      unestimated++
    } else {
      planned += ticket.storyPoints
      if (ticket.status === 'done') completed += ticket.storyPoints
    }
  }
  return { planned, completed, unestimated }
}
