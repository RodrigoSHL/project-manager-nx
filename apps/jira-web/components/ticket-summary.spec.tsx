import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { TicketSummary } from './ticket-summary'
import type { ApiSprint, ApiTeamMember, ApiTicket } from '@/types/project'

const ticket = {
  id: 'story-1', key: 'P-1', projectId: 'project-1', title: 'Historia', type: 'story', status: 'in_progress',
  priority: 'high', assigneeId: 'user-1', sprintId: 'sprint-1', storyPoints: 0, epicId: 'epic-1',
  createdAt: '2026-11-08T12:00:00Z', updatedAt: '2026-11-08T12:00:00Z', dueDate: '2026-11-15',
} as ApiTicket
const epic = { ...ticket, id: 'epic-1', key: 'P-0', title: 'Portal de clientes', type: 'epic' as const }
const child = { ...ticket, id: 'child-1', type: 'subtask' as const, parentTicketId: ticket.id, status: 'done' as const }
const member = { id: 'member-1', userId: 'user-1', name: 'Ana Pérez', projectId: ticket.projectId } as ApiTeamMember
const sprint = { id: 'sprint-1', name: 'Sprint noviembre', projectId: ticket.projectId } as ApiSprint

it('shows the assigned user, calendar due date, zero estimate and scoped child progress', () => {
  render(<TicketSummary ticket={ticket} tickets={[epic, child,
    { ...child, id: 'child-2', status: 'cancelled' },
    { ...child, id: 'child-3', status: 'todo' },
    { ...child, id: 'foreign-child', projectId: 'other-project' },
    { ...child, id: 'other-story-child', parentTicketId: 'another-story' },
  ]} teamMembers={[member]} sprints={[sprint]} />)
  expect(screen.getByText('En curso')).toBeInTheDocument()
  expect(screen.getByText('Ana Pérez')).toBeInTheDocument()
  expect(screen.getByText('Sprint noviembre')).toBeInTheDocument()
  expect(screen.getByText('0 pts')).toBeInTheDocument()
  expect(screen.getByText(new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(2026, 10, 15, 12)))).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'P-0 · Portal de clientes' })).toHaveAttribute('href', '/projects/project-1/tickets/epic-1')
  const progress = screen.getByRole('progressbar', { name: 'Avance de tickets relacionados' })
  expect(progress).toHaveAttribute('aria-valuenow', '2')
  expect(progress).toHaveAttribute('aria-valuemax', '3')
})

it('does not resolve a user, sprint or parent from another project and handles missing values', () => {
  render(<TicketSummary ticket={{ ...ticket, storyPoints: null, dueDate: null }}
    tickets={[{ ...epic, projectId: 'other-project' }]}
    teamMembers={[{ ...member, projectId: 'other-project' }]}
    sprints={[{ ...sprint, projectId: 'other-project' }]} />)
  expect(screen.getByText('Usuario no disponible')).toBeInTheDocument()
  expect(screen.getByText('Sprint no disponible')).toBeInTheDocument()
  expect(screen.getByText('Sin estimar')).toBeInTheDocument()
  expect(screen.getByText('Sin fecha')).toBeInTheDocument()
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
})
