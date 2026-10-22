import * as React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ProjectManagement from './page'
import { getProjectsByWorkspace, getProjectPermissions } from '@/services/projectService'
import { completeSprint, getSprintsByProject } from '@/services/sprintService'
import { getTicketsByProject } from '@/services/ticketService'
import { useWorkspace } from '@/contexts/workspace-context'
import { TicketDetail } from '@/components/ticket-detail'

const workspaceId = '00000000-0000-4000-8000-000000000001'
const projectId = '00000000-0000-4000-8000-000000000002'
const ticketId = '00000000-0000-4000-8000-000000000003'
const commentId = '00000000-0000-4000-8000-000000000004'
jest.mock('@/contexts/workspace-context', () => ({ useWorkspace: jest.fn() }))
jest.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }))
jest.mock('@/services/projectService', () => ({ getProjectsByWorkspace: jest.fn(), getProjectTeamMembers: async () => [], getProjectPermissions: jest.fn().mockResolvedValue({ canWrite: false }) }))
jest.mock('@/services/ticketService', () => ({ getTicketsByProject: jest.fn() }))
jest.mock('@/services/sprintService', () => ({ getSprintsByProject: jest.fn().mockResolvedValue([]), completeSprint: jest.fn() }))
jest.mock('@/components/app-sidebar', () => ({ AppSidebar: () => null }))
jest.mock('@/components/mobile-sidebar', () => ({ MobileSidebar: () => null }))
jest.mock('@/components/top-bar', () => ({ TopBar: () => null }))
jest.mock('@/components/create-sprint-dialog', () => ({ CreateSprintDialog: () => null }))
jest.mock('@/components/edit-sprint-dialog', () => ({ EditSprintDialog: () => null }))
jest.mock('@/components/create-ticket-dialog', () => ({ CreateTicketDialog: () => null }))
jest.mock('@/components/create-support-dialog', () => ({ CreateSupportDialog: () => null }))
jest.mock('@/components/support-view', () => ({ SupportView: () => null }))
jest.mock('@/components/ticket-detail', () => ({ TicketDetail: jest.fn(() => null) }))

describe('mention email navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(useWorkspace).mockReturnValue({ selectedWorkspace: { id: workspaceId } } as never)
    jest.mocked(TicketDetail).mockImplementation(({ open, ticket, highlightedCommentId }) =>
      open && ticket ? <div data-testid="linked-ticket">{ticket.id}:{highlightedCommentId}</div> : null)
    window.history.replaceState({}, '', '/?' + new URLSearchParams({ workspaceId, projectId, ticketId, commentId }))
    jest.mocked(getProjectsByWorkspace).mockResolvedValue([{ id: projectId, workspaceId, name: 'Project' }] as never)
    jest.mocked(getTicketsByProject).mockResolvedValue([{ id: ticketId, projectId, title: 'Ticket', type: 'task', status: 'backlog', labels: [] }] as never)
  })
  it('opens the authorized ticket and passes the target comment to its detail panel', async () => {
    render(<ProjectManagement />)
    await waitFor(() => expect(screen.getByTestId('linked-ticket')).toHaveTextContent(`${ticketId}:${commentId}`))
  })
  it('does not open a ticket absent from the authenticated API response', async () => {
    jest.mocked(getTicketsByProject).mockResolvedValue([])
    render(<ProjectManagement />)
    await waitFor(() => expect(getTicketsByProject).toHaveBeenCalledWith(projectId))
    expect(screen.queryByTestId('linked-ticket')).not.toBeInTheDocument()
  })
})

describe('sprint completion from the project page', () => {
  const sprint = { id: 'sprint', projectId, name: 'Sprint de octubre', isActive: true, goal: null, startDate: null, endDate: null, createdAt: '2026-10-01' }
  const pending = { id: ticketId, projectId, sprintId: sprint.id, key: 'P-1', title: 'Pendiente', status: 'in_review', type: 'task', labels: [], assigneeId: null, storyPoints: 3 }
  const closed = { ...sprint, isActive: false, completedAt: '2026-10-22T15:00:00Z', completionSummary: {
    totalTickets: 1, doneTickets: 0, cancelledTickets: 0, movedTickets: 1,
    totalStoryPoints: 3, completedStoryPoints: 0, targetSprintId: null, targetSprintName: null, tickets: [pending],
  } }

  beforeEach(() => {
    jest.clearAllMocks()
    window.history.replaceState({}, '', '/')
    jest.mocked(useWorkspace).mockReturnValue({ selectedWorkspace: { id: workspaceId } } as never)
    jest.mocked(getProjectsByWorkspace).mockResolvedValue([{ id: projectId, workspaceId, name: 'Project' }] as never)
    jest.mocked(getSprintsByProject).mockResolvedValue([sprint])
    jest.mocked(getTicketsByProject).mockResolvedValue([pending] as never)
    jest.mocked(getProjectPermissions).mockResolvedValue({ canWrite: true } as never)
    jest.mocked(completeSprint).mockResolvedValue(closed as never)
  })

  it('closes the active board, shows history and opens the moved ticket with refreshed state', async () => {
    jest.mocked(TicketDetail).mockImplementation(({ open, ticket }) => open && ticket ? <div data-testid="ticket-state">{ticket.status}:{ticket.sprintId ?? 'none'}</div> : null)
    render(<ProjectManagement />)
    fireEvent.click(await screen.findByRole('button', { name: 'Finalizar sprint' }))
    jest.mocked(getTicketsByProject).mockResolvedValue([{ ...pending, sprintId: null, status: 'backlog' }] as never)
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar sprint' }))
    expect(await screen.findByText('No hay un sprint activo')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Historial de sprints' })).toBeInTheDocument()
    expect(completeSprint).toHaveBeenCalledWith(projectId, sprint.id, null)
    await waitFor(() => expect(getTicketsByProject).toHaveBeenCalledTimes(2))
    fireEvent.click(screen.getByText(/Sprint de octubre · Finalizado el/))
    fireEvent.click(screen.getByRole('button', { name: 'P-1 · Pendiente' }))
    expect(screen.getByTestId('ticket-state')).toHaveTextContent('backlog:none')
    expect(screen.queryByRole('button', { name: 'Activar' })).not.toBeInTheDocument()
  })

  it('hides sprint completion from readers', async () => {
    jest.mocked(getProjectPermissions).mockResolvedValue({ canWrite: false } as never)
    render(<ProjectManagement />)
    await screen.findByText('Sprint de octubre')
    expect(screen.queryByRole('button', { name: 'Finalizar sprint' })).not.toBeInTheDocument()
  })
})
