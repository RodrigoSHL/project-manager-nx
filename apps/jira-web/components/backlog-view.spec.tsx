import * as React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BacklogView } from './backlog-view'
import { getTicketSprintUpdate } from '@/lib/ticket-sprint'
import { updateTicket } from '@/services/ticketService'
import { authenticatedFetch } from '@/lib/api'
import type { ApiSprint, ApiTicket } from '@/types/project'

jest.mock('@/lib/api', () => ({ authenticatedFetch: jest.fn() }))

const ticket: ApiTicket = {
  id: 'ticket-1', key: 'WEB-1', projectId: 'project-1', sprintId: null,
  title: 'Ticket existente', status: 'backlog', type: 'task', priority: 'medium',
  description: null, acceptanceCriteria: null, assigneeId: null, epicId: null,
  reporterId: null, storyPoints: null, dueDate: null, labels: [],
  createdAt: '2026-10-03', updatedAt: '2026-10-03',
}
const sprint: ApiSprint = {
  id: 'sprint-1', projectId: 'project-1', name: 'Sprint en curso',
  isActive: true, goal: null, startDate: null, endDate: null, createdAt: '2026-10-03',
}

function props() {
  return {
    canWrite: true, currentProject: 'project-1', tickets: [ticket], sprints: [sprint],
    onTicketClick: jest.fn(), onCreateTicket: jest.fn(), onCreateEpic: jest.fn(),
    onCreateStory: jest.fn(), onMoveTicketToSprint: jest.fn().mockResolvedValue(undefined),
  }
}

const getMoveButton = () => screen.getByRole('button', { name: 'Mover WEB-1 al sprint actual' })

describe('moving existing backlog tickets', () => {
  it('moves to the active project sprint without opening or creating a ticket', async () => {
    const callbacks = props()
    render(<BacklogView {...callbacks} />)
    fireEvent.click(getMoveButton())

    await waitFor(() => expect(callbacks.onMoveTicketToSprint).toHaveBeenCalledWith(ticket, sprint.id))
    expect(callbacks.onTicketClick).not.toHaveBeenCalled()
    expect(callbacks.onCreateTicket).not.toHaveBeenCalled()
  })

  it('disables the action until a sprint in this project is active', () => {
    render(<BacklogView {...props()} sprints={[{ ...sprint, isActive: false }, { ...sprint, id: 'foreign', projectId: 'other-project' }]} />)
    expect(getMoveButton()).toBeDisabled()
    expect(screen.getByText(/Activa un sprint desde Sprint actual/)).toBeInTheDocument()
  })

  it('hides the action from readers and from epics', () => {
    const { rerender } = render(<BacklogView {...props()} canWrite={false} />)
    expect(screen.queryByRole('button', { name: /Mover WEB-1/ })).not.toBeInTheDocument()
    rerender(<BacklogView {...props()} tickets={[{ ...ticket, type: 'epic' }]} />)
    expect(screen.queryByRole('button', { name: /Mover WEB-1/ })).not.toBeInTheDocument()
  })

  it('prevents duplicate moves while the request is pending', async () => {
    const callbacks = props()
    let complete!: () => void
    callbacks.onMoveTicketToSprint.mockImplementation(() => new Promise<void>(resolve => { complete = resolve }))
    render(<BacklogView {...callbacks} />)
    fireEvent.click(getMoveButton())
    expect(getMoveButton()).toBeDisabled()
    fireEvent.click(getMoveButton())
    expect(callbacks.onMoveTicketToSprint).toHaveBeenCalledTimes(1)
    await act(async () => complete())
    expect(getMoveButton()).toBeEnabled()
  })

  it('shows the server error and allows retrying without removing the ticket', async () => {
    const callbacks = props()
    callbacks.onMoveTicketToSprint.mockRejectedValue(new Error('No se pudo guardar'))
    render(<BacklogView {...callbacks} />)
    fireEvent.click(getMoveButton())
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar')
    expect(screen.getByText(ticket.title)).toBeInTheDocument()
    expect(getMoveButton()).toBeEnabled()
  })

  it('persists sprint and status together and renders the saved ticket in the sprint', async () => {
    const savedTicket = { ...ticket, sprintId: sprint.id, status: 'todo' as const }
    jest.mocked(authenticatedFetch).mockResolvedValue({ ok: true, json: async () => savedTicket } as Response)

    function BacklogWithPersistence() {
      const [tickets, setTickets] = React.useState([ticket])
      return <BacklogView {...props()} tickets={tickets} onMoveTicketToSprint={async (selected, sprintId) => {
        const saved = await updateTicket(selected.projectId, selected.id, getTicketSprintUpdate(selected, sprintId))
        setTickets([saved])
      }} />
    }

    render(<BacklogWithPersistence />)
    fireEvent.click(getMoveButton())
    await waitFor(() => expect(screen.queryByRole('button', { name: /Mover WEB-1/ })).not.toBeInTheDocument())
    expect(screen.getByText(ticket.title)).toBeInTheDocument()
    expect(screen.getByText('El backlog está vacío')).toBeInTheDocument()
    expect(authenticatedFetch).toHaveBeenCalledWith('/api/projects/project-1/tickets/ticket-1', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sprintId: sprint.id, status: 'todo' }),
    })
  })
})
