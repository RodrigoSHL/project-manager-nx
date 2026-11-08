import * as React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { TicketPage } from './ticket-page'
import { TicketDetail } from './ticket-detail'
import { getProjects, getProjectPermissions, getProjectTeamMembers } from '@/services/projectService'
import { getTicketsByProject } from '@/services/ticketService'
import { getSprintsByProject } from '@/services/sprintService'
import type { ApiProject, ApiTicket } from '@/types/project'

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))
jest.mock('@/services/projectService', () => ({ getProjects: jest.fn(), getProjectPermissions: jest.fn(), getProjectTeamMembers: jest.fn() }))
jest.mock('@/services/ticketService', () => ({ getTicketsByProject: jest.fn() }))
jest.mock('@/services/sprintService', () => ({ getSprintsByProject: jest.fn() }))
jest.mock('@/components/theme-toggle', () => ({ ThemeToggle: () => null }))
jest.mock('@/components/create-ticket-dialog', () => ({ CreateTicketDialog: () => null }))
jest.mock('@/components/ticket-detail', () => ({ TicketDetail: jest.fn() }))

const project = { id: 'project-1', workspaceId: 'workspace-1', name: 'Proyecto de prueba' } as ApiProject
const ticket = { id: 'ticket-1', projectId: project.id, title: 'Detalle completo', type: 'story' } as ApiTicket
const child = { ...ticket, id: 'ticket-2', title: 'Subtarea', type: 'subtask' as const }
const push = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(useRouter).mockReturnValue({ push } as never)
  jest.mocked(getProjects).mockResolvedValue([project])
  jest.mocked(getProjectPermissions).mockResolvedValue({ canWrite: false, workspaceRole: 'viewer' })
  jest.mocked(getProjectTeamMembers).mockResolvedValue([])
  jest.mocked(getSprintsByProject).mockResolvedValue([])
  jest.mocked(getTicketsByProject).mockResolvedValue([ticket, child])
  jest.mocked(TicketDetail).mockImplementation(props => <div>
    <h1>{props.ticket?.title}</h1>
    <span>{props.variant}:{String(props.canWrite)}</span>
    <button onClick={() => props.onSelectTicket(child)}>Ver subtarea</button>
    <button onClick={() => props.onUpdated({ ...ticket, title: 'Título actualizado' })}>Guardar título</button>
    <button onClick={() => props.onDeleted(ticket.id)}>Eliminar ticket</button>
  </div>)
})

it('loads a ticket directly in page mode with viewer permissions and a project return link', async () => {
  render(<TicketPage projectId={project.id} ticketId={ticket.id} />)
  expect(await screen.findByRole('heading', { name: ticket.title })).toBeInTheDocument()
  expect(screen.getByText('page:false')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Volver al proyecto' })).toHaveAttribute('href', '/?workspaceId=workspace-1&projectId=project-1')
  fireEvent.click(screen.getByRole('button', { name: 'Ver subtarea' }))
  expect(push).toHaveBeenCalledWith('/projects/project-1/tickets/ticket-2')
})

it('updates the shared detail and returns to the project after deleting a ticket', async () => {
  jest.mocked(getProjectPermissions).mockResolvedValue({ canWrite: true, workspaceRole: 'admin' })
  render(<TicketPage projectId={project.id} ticketId={ticket.id} />)
  await screen.findByRole('heading', { name: ticket.title })
  expect(screen.getByText('page:true')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Guardar título' }))
  expect(screen.getByRole('heading', { name: 'Título actualizado' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar ticket' }))
  expect(push).toHaveBeenCalledWith('/?workspaceId=workspace-1&projectId=project-1')
})

it('does not request ticket data for a project absent from the authorized project list', async () => {
  jest.mocked(getProjects).mockResolvedValue([])
  render(<TicketPage projectId={project.id} ticketId={ticket.id} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('no tienes acceso')
  expect(getTicketsByProject).not.toHaveBeenCalled()
  expect(TicketDetail).not.toHaveBeenCalled()
})

it('does not render a missing ticket or a ticket from another project', async () => {
  jest.mocked(getTicketsByProject).mockResolvedValue([{ ...ticket, projectId: 'other-project' }])
  render(<TicketPage projectId={project.id} ticketId={ticket.id} />)
  expect(await screen.findByRole('heading', { name: 'Ticket no disponible' })).toBeInTheDocument()
  expect(TicketDetail).not.toHaveBeenCalled()
})

it('allows retrying a failed load', async () => {
  jest.mocked(getTicketsByProject).mockRejectedValueOnce(new Error('Conexión interrumpida'))
  render(<TicketPage projectId={project.id} ticketId={ticket.id} />)
  expect(await screen.findByRole('alert')).toHaveTextContent('Conexión interrumpida')
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
  await waitFor(() => expect(screen.getByRole('heading', { name: ticket.title })).toBeInTheDocument())
})
