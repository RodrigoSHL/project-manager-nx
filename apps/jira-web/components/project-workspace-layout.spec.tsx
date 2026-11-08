import * as React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { ProjectWorkspaceLayout } from './project-workspace-layout'
import { TicketPage } from './ticket-page'
import { useWorkspace } from '@/contexts/workspace-context'
import { getProjects, getProjectsByWorkspace, getProjectPermissions } from '@/services/projectService'
import { getTicketsByProject } from '@/services/ticketService'
import { TopBar } from './top-bar'
import type { ApiProject, ApiTicket } from '@/types/project'

jest.mock('next/navigation', () => ({ useParams: jest.fn(), usePathname: jest.fn(), useRouter: jest.fn() }))
jest.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }))
jest.mock('@/contexts/workspace-context', () => ({ useWorkspace: jest.fn() }))
jest.mock('@/services/projectService', () => ({ getProjects: jest.fn(), getProjectsByWorkspace: jest.fn(), getProjectTeamMembers: async () => [], getProjectPermissions: jest.fn() }))
jest.mock('@/services/ticketService', () => ({ getTicketsByProject: jest.fn() }))
jest.mock('@/services/sprintService', () => ({ getSprintsByProject: async () => [] }))
jest.mock('@/components/app-sidebar', () => ({ AppSidebar: (props: React.ComponentProps<typeof import('./app-sidebar').AppSidebar>) => <aside aria-label="Navegación principal">
  <span>{props.collapsed ? 'Menú contraído' : 'Menú expandido'}</span>
  <button onClick={props.onToggle}>Alternar menú</button>
  <button onClick={() => props.onViewChange('backlog')}>Ir al backlog</button>
  <button onClick={() => props.onProjectChange('project-2')}>Cambiar proyecto</button>
  <span>{props.currentProject}</span>
</aside> }))
jest.mock('@/components/mobile-sidebar', () => ({ MobileSidebar: () => null }))
jest.mock('@/components/top-bar', () => ({ TopBar: jest.fn(props => <header>
  <input aria-label="Buscar tickets" value={props.searchQuery} onChange={event => props.onSearchChange(event.target.value)} />
  <button onClick={() => props.onFilterChange('priority', 'high')}>Filtrar prioridad</button>
  <span>{props.filters.priority}</span>
</header>) }))
jest.mock('@/components/create-sprint-dialog', () => ({ CreateSprintDialog: () => null }))
jest.mock('@/components/create-ticket-dialog', () => ({ CreateTicketDialog: () => null }))
jest.mock('@/components/create-support-dialog', () => ({ CreateSupportDialog: () => null }))
jest.mock('@/components/backlog-view', () => ({ BacklogView: () => <p>Contenido del backlog</p> }))
jest.mock('@/components/ticket-detail', () => ({ TicketDetail: (props: React.ComponentProps<typeof import('./ticket-detail').TicketDetail>) => props.open && props.ticket ? <div>
  <h1>{props.ticket.title}</h1>
  <button onClick={() => { if (props.ticket) props.onUpdated({ ...props.ticket, title: 'Título actualizado' }) }}>Guardar ticket</button>
</div> : null }))

const workspace = { id: 'workspace-1', name: 'Mi workspace' }
const projects = [
  { id: 'project-1', name: 'Mi proyecto', workspaceId: workspace.id },
  { id: 'project-2', name: 'Otro proyecto', workspaceId: workspace.id },
] as ApiProject[]
const tickets = [{ id: 'ticket-1', key: 'P-1', title: 'Ticket completo', projectId: 'project-1', type: 'task', status: 'todo', labels: [] }] as unknown as ApiTicket[]
const push = jest.fn()
const setSelectedWorkspace = jest.fn()
const workspaces = [workspace]

function route(ticket = false, projectId = 'project-1') {
  jest.mocked(usePathname).mockReturnValue(ticket ? `/projects/${projectId}/tickets/ticket-1` : '/')
  jest.mocked(useParams).mockReturnValue(ticket ? { projectId, ticketId: 'ticket-1' } : {})
}

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  window.history.replaceState({}, '', '/')
  route()
  jest.mocked(useRouter).mockReturnValue({ push } as never)
  jest.mocked(useWorkspace).mockReturnValue({ selectedWorkspace: workspace, workspaces, setSelectedWorkspace, loading: false } as never)
  jest.mocked(getProjects).mockResolvedValue(projects)
  jest.mocked(getProjectsByWorkspace).mockResolvedValue(projects)
  jest.mocked(getTicketsByProject).mockResolvedValue(tickets)
  jest.mocked(getProjectPermissions).mockResolvedValue({ canWrite: true, workspaceRole: 'admin' })
})

it('keeps sidebar, header, search, filters and board scroll mounted while opening and closing a ticket', async () => {
  const view = render(<ProjectWorkspaceLayout>{null}</ProjectWorkspaceLayout>)
  await waitFor(() => expect(getTicketsByProject).toHaveBeenCalledWith('project-1'))
  await waitFor(() => expect(jest.mocked(TopBar).mock.calls.at(-1)?.[0].canWrite).toBe(true))
  const sidebar = screen.getByRole('complementary', { name: 'Navegación principal' })
  const header = screen.getByRole('banner')
  fireEvent.click(screen.getByRole('button', { name: 'Alternar menú' }))
  fireEvent.change(screen.getByRole('textbox', { name: 'Buscar tickets' }), { target: { value: 'Ticket' } })
  fireEvent.click(screen.getByRole('button', { name: 'Filtrar prioridad' }))
  const main = screen.getByRole('main')
  main.scrollTop = 240
  fireEvent.scroll(main)

  route(true)
  view.rerender(<ProjectWorkspaceLayout><TicketPage projectId="project-1" ticketId="ticket-1" /></ProjectWorkspaceLayout>)
  expect(await screen.findByRole('heading', { name: 'Ticket completo' })).toBeInTheDocument()
  expect(screen.getByRole('complementary', { name: 'Navegación principal' })).toBe(sidebar)
  expect(screen.getByRole('banner')).toBe(header)
  expect(screen.getByText('Menú contraído')).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Buscar tickets' })).toHaveValue('Ticket')
  expect(getTicketsByProject).toHaveBeenCalledTimes(1)
  expect(getProjects).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Guardar ticket' }))
  expect(screen.getByRole('heading', { name: 'Título actualizado' })).toBeInTheDocument()

  route()
  view.rerender(<ProjectWorkspaceLayout>{null}</ProjectWorkspaceLayout>)
  expect(screen.getByRole('main').scrollTop).toBe(240)
  expect(screen.getByText('Menú contraído')).toBeInTheDocument()
  expect(jest.mocked(TopBar).mock.calls.at(-1)?.[0].filters.priority).toBe('high')
  expect(getTicketsByProject).toHaveBeenCalledTimes(1)
})

it('navigates to a section or another project from the ticket using the existing sidebar', async () => {
  route(true)
  const view = render(<ProjectWorkspaceLayout><TicketPage projectId="project-1" ticketId="ticket-1" /></ProjectWorkspaceLayout>)
  await screen.findByRole('heading', { name: 'Ticket completo' })
  fireEvent.click(screen.getByRole('button', { name: 'Ir al backlog' }))
  expect(push).toHaveBeenCalledWith('/')
  route()
  view.rerender(<ProjectWorkspaceLayout>{null}</ProjectWorkspaceLayout>)
  expect(screen.getByText('Contenido del backlog')).toBeInTheDocument()
  route(true)
  view.rerender(<ProjectWorkspaceLayout><TicketPage projectId="project-1" ticketId="ticket-1" /></ProjectWorkspaceLayout>)
  await screen.findByRole('heading', { name: 'Ticket completo' })
  fireEvent.click(screen.getByRole('button', { name: 'Cambiar proyecto' }))
  await waitFor(() => expect(getTicketsByProject).toHaveBeenCalledWith('project-2'))
  expect(push).toHaveBeenLastCalledWith('/')
})

it('resolves a direct ticket URL in another authorized workspace and selects its project', async () => {
  const otherWorkspace = { id: 'workspace-2', name: 'Otro workspace' }
  const project = { ...projects[0], workspaceId: otherWorkspace.id }
  jest.mocked(useWorkspace).mockReturnValue({ selectedWorkspace: workspace, workspaces: [workspace, otherWorkspace], setSelectedWorkspace, loading: false } as never)
  jest.mocked(getProjects).mockResolvedValue([project])
  jest.mocked(getProjectsByWorkspace).mockResolvedValue([projects[1]])
  route(true)
  const view = render(<ProjectWorkspaceLayout><TicketPage projectId="project-1" ticketId="ticket-1" /></ProjectWorkspaceLayout>)
  await waitFor(() => expect(setSelectedWorkspace).toHaveBeenCalledWith(otherWorkspace))
  jest.mocked(getProjectsByWorkspace).mockResolvedValue([project])
  jest.mocked(useWorkspace).mockReturnValue({ selectedWorkspace: otherWorkspace, workspaces: [workspace, otherWorkspace], setSelectedWorkspace, loading: false } as never)
  view.rerender(<ProjectWorkspaceLayout><TicketPage projectId="project-1" ticketId="ticket-1" /></ProjectWorkspaceLayout>)
  expect(await screen.findByRole('heading', { name: 'Ticket completo' })).toBeInTheDocument()
  expect(screen.getByRole('complementary', { name: 'Navegación principal' })).toHaveTextContent('project-1')
})

it('keeps the layout but does not show a ticket in an inaccessible project', async () => {
  jest.mocked(getProjects).mockResolvedValue([])
  route(true, 'private-project')
  render(<ProjectWorkspaceLayout><TicketPage projectId="private-project" ticketId="ticket-1" /></ProjectWorkspaceLayout>)
  expect(await screen.findByRole('alert')).toHaveTextContent('no tienes acceso')
  expect(screen.getByRole('complementary', { name: 'Navegación principal' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Ticket completo' })).not.toBeInTheDocument()
  expect(getTicketsByProject).not.toHaveBeenCalledWith('private-project')
})
