import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { TicketDependencies } from './ticket-dependencies'
import {
  addTicketDependency,
  getTicketDependencies,
  removeTicketDependency,
} from '@/services/ticketService'
import type { ApiTicket } from '@/types/project'

jest.mock('@/services/ticketService', () => ({
  addTicketDependency: jest.fn(),
  getTicketDependencies: jest.fn(),
  removeTicketDependency: jest.fn(),
}))

const ticket = {
  id: 'x',
  projectId: 'project',
  key: 'PM-1',
  title: 'Diseño',
  status: 'todo',
  type: 'story',
} as ApiTicket
const prerequisite = { ...ticket, id: 'y', key: 'PM-2', title: 'Requisitos' }
const foreign = {
  ...ticket,
  id: 'foreign',
  projectId: 'other',
  key: 'OT-1',
  title: 'Otro proyecto',
}

it('selects a dependency by title, saves it, opens the related ticket and removes the link', async () => {
  jest
    .mocked(getTicketDependencies)
    .mockResolvedValue({ dependsOn: [], blocks: [] })
  jest
    .mocked(addTicketDependency)
    .mockResolvedValue({ dependsOn: [prerequisite], blocks: [] })
  jest.mocked(removeTicketDependency).mockResolvedValue(undefined)
  const onSelect = jest.fn()
  render(
    <TicketDependencies
      ticket={ticket}
      tickets={[ticket, prerequisite, foreign]}
      canWrite
      onSelect={onSelect}
    />
  )
  await screen.findByText('Este ticket no tiene dependencias.')
  fireEvent.click(screen.getByRole('button', { name: 'Agregar dependencia' }))
  const dialog = screen.getByRole('dialog', { name: 'Agregar dependencia' })
  expect(
    within(dialog).queryByRole('button', { name: /OT-1|PM-1 Diseño/ })
  ).not.toBeInTheDocument()
  fireEvent.change(
    within(dialog).getByRole('textbox', { name: 'Buscar ticket' }),
    { target: { value: 'requisitos' } }
  )
  fireEvent.click(
    within(dialog).getByRole('button', { name: /PM-2 Requisitos/ })
  )
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Guardar dependencia' })
  )
  await waitFor(() => expect(dialog).not.toBeInTheDocument())
  expect(addTicketDependency).toHaveBeenCalledWith('project', 'x', 'y')
  fireEvent.click(
    within(screen.getByRole('list', { name: 'Depende de' })).getByRole(
      'button',
      { name: /PM-2 Requisitos/ }
    )
  )
  expect(onSelect).toHaveBeenCalledWith(prerequisite)
  fireEvent.click(
    screen.getByRole('button', { name: 'Quitar dependencia con PM-2' })
  )
  await screen.findByText('Este ticket no tiene dependencias.')
  expect(removeTicketDependency).toHaveBeenCalledWith('project', 'x', 'y')
})

it('shows the inverse relationship to a reader without mutation controls', async () => {
  jest
    .mocked(getTicketDependencies)
    .mockResolvedValue({ dependsOn: [], blocks: [ticket] })
  render(
    <TicketDependencies
      ticket={prerequisite}
      tickets={[ticket, prerequisite]}
      canWrite={false}
      onSelect={jest.fn()}
    />
  )
  const list = await screen.findByRole('list', { name: 'Bloquea a' })
  expect(
    within(list).getByRole('button', { name: /PM-1 Diseño/ })
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', {
      name: /Agregar dependencia|Quitar dependencia/,
    })
  ).not.toBeInTheDocument()
})
