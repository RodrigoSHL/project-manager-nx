import * as React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ProjectManagement from './page'
import { getProjectsByWorkspace, getProjectPermissions } from '@/services/projectService'
import { completeSprint, getSprintsByProject } from '@/services/sprintService'
import { getTicketsByProject } from '@/services/ticketService'
import { useWorkspace } from '@/contexts/workspace-context'
import { TicketDetail } from '@/components/ticket-detail'
import { CreateTicketDialog } from '@/components/create-ticket-dialog'
import { TopBar } from '@/components/top-bar'

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
jest.mock('@/components/top-bar', () => ({ TopBar: jest.fn(() => null) }))
jest.mock('@/components/create-sprint-dialog', () => ({ CreateSprintDialog: () => null }))
jest.mock('@/components/edit-sprint-dialog', () => ({ EditSprintDialog: () => null }))
jest.mock('@/components/create-ticket-dialog', () => ({ CreateTicketDialog: jest.fn(() => null) }))
jest.mock('@/components/create-support-dialog', () => ({ CreateSupportDialog: () => null }))
jest.mock('@/components/support-view', () => ({ SupportView: () => null }))
jest.mock('@/components/ticket-detail', () => ({ TicketDetail: jest.fn(() => null) }))

beforeEach(() => localStorage.clear())

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

describe('subtask creation from a story detail', () => {
  it.each([false, true])('preselects the story and preserves its detail after creating a child (closed sprint: %s)', async closed => {
    jest.clearAllMocks()
    const story = { id: ticketId, projectId, key: 'P-1', title: 'Story', type: 'story', epicId: 'epic-1', sprintId: 'sprint-1', status: 'todo', labels: [] }
    const child = { ...story, id: 'child-1', key: 'P-2', type: 'subtask', parentTicketId: ticketId, epicId: null }
    window.history.replaceState({}, '', '/?' + new URLSearchParams({ workspaceId, projectId, ticketId, commentId }))
    jest.mocked(useWorkspace).mockReturnValue({ selectedWorkspace: { id: workspaceId } } as never)
    jest.mocked(getProjectsByWorkspace).mockResolvedValue([{ id: projectId, workspaceId, name: 'Project' }] as never)
    jest.mocked(getProjectPermissions).mockResolvedValue({ canWrite: true } as never)
    jest.mocked(getTicketsByProject).mockResolvedValue([story] as never)
    jest.mocked(getSprintsByProject).mockResolvedValue([{ id: 'sprint-1', projectId, name: 'Sprint', isActive: !closed, completedAt: closed ? '2026-10-31T12:00:00Z' : null }] as never)
    jest.mocked(TicketDetail).mockImplementation(({ ticket, open, onCreateChild, tickets }) => open && ticket ? (
      <div>
        <span data-testid="parent-detail">{ticket.id}:{tickets?.filter(child => child.parentTicketId === ticket.id).length}</span>
        <button onClick={() => onCreateChild?.(ticket)}>Crear subtarea desde historia</button>
      </div>
    ) : null)
    jest.mocked(CreateTicketDialog).mockImplementation(({ open, initialType, initialParentTicketId, initialSprintId, onCreated, onOpenChange }) => open ? (
      <div>
        <span data-testid="subtask-form">{initialType}:{initialParentTicketId}:{initialSprintId ?? 'none'}</span>
        <button onClick={() => { onCreated(child as never); onOpenChange(false) }}>Guardar subtarea</button>
      </div>
    ) : <></>)
    render(<ProjectManagement />)
    await waitFor(() => expect(getProjectPermissions).toHaveBeenCalledWith(projectId))
    const create = await screen.findByRole('button', { name: 'Crear subtarea desde historia' })
    await waitFor(() => expect(jest.mocked(TicketDetail).mock.calls.at(-1)?.[0].canWrite).toBe(true))
    fireEvent.click(create)
    expect(await screen.findByTestId('subtask-form')).toHaveTextContent(`subtask:${ticketId}:${closed ? 'none' : 'sprint-1'}`)
    fireEvent.click(screen.getByRole('button', { name: 'Guardar subtarea' }))
    expect(screen.getByTestId('parent-detail')).toHaveTextContent(`${ticketId}:1`)
  })
})

describe('remembered project selection', () => {
  const secondId = '00000000-0000-4000-8000-000000000005'
  const otherWorkspaceId = '00000000-0000-4000-8000-000000000006'
  const otherProjectId = '00000000-0000-4000-8000-000000000007'
  const key = `jira-web:projectId:${workspaceId}`
  const otherKey = `jira-web:projectId:${otherWorkspaceId}`
  const projects = [{ id: projectId, workspaceId, name: 'Primer proyecto' }, { id: secondId, workspaceId, name: 'Último proyecto' }]

  beforeEach(() => {
    jest.clearAllMocks()
    window.history.replaceState({}, '', '/')
    jest.mocked(useWorkspace).mockReturnValue({ selectedWorkspace: { id: workspaceId } } as never)
    jest.mocked(getProjectsByWorkspace).mockResolvedValue(projects as never)
    jest.mocked(getTicketsByProject).mockResolvedValue([])
    jest.mocked(getSprintsByProject).mockResolvedValue([])
    jest.mocked(getProjectPermissions).mockResolvedValue({ canWrite: false } as never)
    jest.mocked(TicketDetail).mockImplementation(() => null)
    jest.mocked(CreateTicketDialog).mockImplementation(() => <></>)
    jest.mocked(TopBar).mockImplementation(({ projects = [], currentProject, onProjectChange }) => (
      <select aria-label="Proyecto actual" value={currentProject} onChange={event => onProjectChange(event.target.value)}>
        {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
      </select>
    ))
  })
  afterEach(() => jest.restoreAllMocks())

  it('saves a manual selection and restores it after remounting instead of selecting the first project', async () => {
    const view = render(<ProjectManagement />)
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Proyecto actual' })).toHaveValue(projectId))
    fireEvent.change(screen.getByRole('combobox', { name: 'Proyecto actual' }), { target: { value: secondId } })
    expect(localStorage.getItem(key)).toBe(secondId)
    view.unmount()
    jest.mocked(getTicketsByProject).mockClear()
    render(<ProjectManagement />)
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Proyecto actual' })).toHaveValue(secondId))
    expect(getTicketsByProject).toHaveBeenCalledWith(secondId)
    expect(getTicketsByProject).not.toHaveBeenCalledWith(projectId)
  })

  it('replaces a deleted or inaccessible saved project with an available project', async () => {
    localStorage.setItem(key, 'inaccessible-project')
    render(<ProjectManagement />)
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Proyecto actual' })).toHaveValue(projectId))
    expect(localStorage.getItem(key)).toBe(projectId)
    expect(getTicketsByProject).not.toHaveBeenCalledWith('inaccessible-project')
  })

  it('remembers an independent project per workspace when switching back and forth', async () => {
    localStorage.setItem(key, secondId)
    localStorage.setItem(otherKey, otherProjectId)
    jest.mocked(getProjectsByWorkspace).mockImplementation(async id => (id === workspaceId ? projects : [{ id: otherProjectId, workspaceId: otherWorkspaceId, name: 'Otro workspace' }]) as never)
    const view = render(<ProjectManagement />)
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Proyecto actual' })).toHaveValue(secondId))
    jest.mocked(useWorkspace).mockReturnValue({ selectedWorkspace: { id: otherWorkspaceId } } as never)
    view.rerender(<ProjectManagement />)
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Proyecto actual' })).toHaveValue(otherProjectId))
    expect(localStorage.getItem(key)).toBe(secondId)
    expect(localStorage.getItem(otherKey)).toBe(otherProjectId)
    jest.mocked(useWorkspace).mockReturnValue({ selectedWorkspace: { id: workspaceId } } as never)
    view.rerender(<ProjectManagement />)
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Proyecto actual' })).toHaveValue(secondId))
  })

  it('gives an accessible ticket link priority over the saved project', async () => {
    localStorage.setItem(key, secondId)
    window.history.replaceState({}, '', '/?' + new URLSearchParams({ workspaceId, projectId, ticketId, commentId }))
    render(<ProjectManagement />)
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Proyecto actual' })).toHaveValue(projectId))
    expect(localStorage.getItem(key)).toBe(projectId)
  })

  it('returns from a ticket page to the linked project without opening a panel', async () => {
    localStorage.setItem(key, secondId)
    window.history.replaceState({}, '', '/?' + new URLSearchParams({ workspaceId, projectId }))
    render(<ProjectManagement />)
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Proyecto actual' })).toHaveValue(projectId))
    expect(localStorage.getItem(key)).toBe(projectId)
    expect(jest.mocked(TicketDetail).mock.calls.every(([props]) => !props.open)).toBe(true)
  })

  it('applies the return link once and preserves later project choices when switching workspaces', async () => {
    window.history.replaceState({}, '', '/?' + new URLSearchParams({ workspaceId, projectId }))
    jest.mocked(getProjectsByWorkspace).mockImplementation(async id => (id === workspaceId ? projects : [{ id: otherProjectId, workspaceId: otherWorkspaceId, name: 'Otro workspace' }]) as never)
    const view = render(<ProjectManagement />)
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Proyecto actual' })).toHaveValue(projectId))
    fireEvent.change(screen.getByRole('combobox', { name: 'Proyecto actual' }), { target: { value: secondId } })
    jest.mocked(useWorkspace).mockReturnValue({ selectedWorkspace: { id: otherWorkspaceId } } as never)
    view.rerender(<ProjectManagement />)
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Proyecto actual' })).toHaveValue(otherProjectId))
    jest.mocked(useWorkspace).mockReturnValue({ selectedWorkspace: { id: workspaceId } } as never)
    view.rerender(<ProjectManagement />)
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Proyecto actual' })).toHaveValue(secondId))
  })

  it('clears an obsolete preference when a workspace no longer has accessible projects', async () => {
    localStorage.setItem(key, secondId)
    jest.mocked(getProjectsByWorkspace).mockResolvedValue([])
    render(<ProjectManagement />)
    await waitFor(() => expect(localStorage.getItem(key)).toBeNull())
    expect(getTicketsByProject).not.toHaveBeenCalled()
  })

  it('keeps project navigation working if localStorage is blocked', async () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage blocked') })
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage blocked') })
    render(<ProjectManagement />)
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Proyecto actual' })).toHaveValue(projectId))
    fireEvent.change(screen.getByRole('combobox', { name: 'Proyecto actual' }), { target: { value: secondId } })
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Proyecto actual' })).toHaveValue(secondId))
  })
})
