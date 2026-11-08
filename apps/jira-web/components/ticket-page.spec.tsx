import * as React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { TicketPage } from './ticket-page'
import { TicketDetail } from './ticket-detail'
import { ProjectContext, type ProjectContextValue } from '@/contexts/project-context'
import type { ApiProject, ApiTicket } from '@/types/project'

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))
jest.mock('@/components/ticket-detail', () => ({ TicketDetail: jest.fn() }))

const project = { id: 'project-1', workspaceId: 'workspace-1', name: 'Proyecto de prueba' } as ApiProject
const ticket = { id: 'ticket-1', key: 'P-1', projectId: project.id, title: 'Detalle completo', type: 'story',
  status: 'todo', priority: 'high', storyPoints: null, assigneeId: null, sprintId: null } as ApiTicket
const child = { ...ticket, id: 'ticket-2', title: 'Subtarea', type: 'subtask' as const }
const push = jest.fn()
const onTicketDeleted = jest.fn()
const onCreateChild = jest.fn()

function Page({ initial = {} }: { initial?: Partial<ProjectContextValue> }) {
  const [tickets, setTickets] = React.useState([ticket, child])
  const [error, setError] = React.useState(initial.error ?? null)
  return <ProjectContext.Provider value={{
    project, tickets, sprints: [], teamMembers: [], canWrite: false, loading: false,
    onTicketUpdated: updated => setTickets(items => items.map(item => item.id === updated.id ? updated : item)),
    onTicketDeleted, onCreateChild, ...initial,
    error, reload: () => setError(null),
  }}><TicketPage projectId={project.id} ticketId={ticket.id} /></ProjectContext.Provider>
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(useRouter).mockReturnValue({ push } as never)
  jest.mocked(TicketDetail).mockImplementation(props => <div>
    <h1>{props.ticket?.title}</h1>
    <span>{props.variant}:{String(props.canWrite)}</span>
    <button onClick={() => props.onSelectTicket(child)}>Ver subtarea</button>
    <button onClick={() => props.onUpdated({ ...ticket, title: 'Título actualizado', status: 'done', storyPoints: 5 })}>Guardar título</button>
    <button onClick={() => props.onDeleted(ticket.id)}>Eliminar ticket</button>
    {props.onCreateChild && <button onClick={() => props.onCreateChild?.(ticket)}>Crear subtarea</button>}
  </div>)
})

it('uses the shared project state with viewer permissions and returns within the application', () => {
  render(<Page />)
  expect(screen.getByRole('heading', { name: ticket.title })).toBeInTheDocument()
  expect(screen.getByText('page:false')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Volver al proyecto' })).toHaveAttribute('href', '/')
  expect(screen.queryByRole('button', { name: 'Crear subtarea' })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Ver subtarea' }))
  expect(push).toHaveBeenCalledWith('/projects/project-1/tickets/ticket-2')
})

it('updates shared tickets, creates children and returns to the board after deletion', () => {
  render(<Page initial={{ canWrite: true }} />)
  expect(screen.getByText('page:true')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Guardar título' }))
  expect(screen.getByRole('heading', { name: 'Título actualizado' })).toBeInTheDocument()
  const summary = within(screen.getByRole('complementary', { name: 'Resumen del ticket' }))
  expect(summary.getByText('Completado')).toBeInTheDocument()
  expect(summary.getByText('5 pts')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Crear subtarea' }))
  expect(onCreateChild).toHaveBeenCalledWith(ticket)
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar ticket' }))
  expect(onTicketDeleted).toHaveBeenCalledWith(ticket.id)
  expect(push).toHaveBeenCalledWith('/')
})

it.each([
  { tickets: [] },
  { tickets: [{ ...ticket, projectId: 'other-project' }] },
  { project: { ...project, id: 'other-project' } },
])('does not render a ticket outside the current authorized project: %j', initial => {
  render(<Page initial={initial} />)
  expect(screen.getByRole('heading', { name: 'Ticket no disponible' })).toBeInTheDocument()
  expect(TicketDetail).not.toHaveBeenCalled()
})

it('shows loading and allows retrying a failed shared project load', () => {
  const view = render(<Page initial={{ loading: true }} />)
  expect(screen.getByRole('status')).toHaveTextContent('Cargando ticket')
  view.unmount()
  render(<Page initial={{ error: 'Conexión interrumpida' }} />)
  expect(screen.getByRole('alert')).toHaveTextContent('Conexión interrumpida')
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
  expect(screen.getByRole('heading', { name: ticket.title })).toBeInTheDocument()
})
