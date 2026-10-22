import * as React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import ProjectManagement from './page'
import { getProjectsByWorkspace } from '@/services/projectService'
import { getTicketsByProject } from '@/services/ticketService'
import { useWorkspace } from '@/contexts/workspace-context'
import { TicketDetail } from '@/components/ticket-detail'

const workspaceId = '00000000-0000-4000-8000-000000000001'
const projectId = '00000000-0000-4000-8000-000000000002'
const ticketId = '00000000-0000-4000-8000-000000000003'
const commentId = '00000000-0000-4000-8000-000000000004'
jest.mock('@/contexts/workspace-context', () => ({ useWorkspace: jest.fn() }))
jest.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }))
jest.mock('@/services/projectService', () => ({ getProjectsByWorkspace: jest.fn(), getProjectTeamMembers: async () => [], getProjectPermissions: async () => ({ canWrite: false }) }))
jest.mock('@/services/ticketService', () => ({ getTicketsByProject: jest.fn() }))
jest.mock('@/services/sprintService', () => ({ getSprintsByProject: async () => [] }))
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
