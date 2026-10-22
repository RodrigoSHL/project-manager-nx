import * as React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CompleteSprintDialog } from './complete-sprint-dialog'
import { CompletedSprints } from './completed-sprints'
import { completeSprint } from '@/services/sprintService'
import type { ApiSprint, ApiTicket } from '@/types/project'

jest.mock('@/services/sprintService', () => ({ completeSprint: jest.fn() }))
const sprint = { id: 'current', projectId: 'project', name: 'Sprint actual', isActive: true } as ApiSprint
const next = { ...sprint, id: 'next', name: 'Próximo sprint', isActive: false }
const tickets = [
  { id: 'done', projectId: 'project', sprintId: 'current', status: 'done', key: 'P-1', title: 'Entregado' },
  { id: 'pending', projectId: 'project', sprintId: 'current', status: 'in_progress', key: 'P-2', title: 'Pendiente' },
  { id: 'cancelled', projectId: 'project', sprintId: 'current', status: 'cancelled' },
  { id: 'foreign', projectId: 'foreign', sprintId: 'current', status: 'todo' },
] as ApiTicket[]
const completed = { ...sprint, isActive: false, completedAt: '2026-10-22T12:00:00Z', completionSummary: {
  totalTickets: 3, doneTickets: 1, cancelledTickets: 1, movedTickets: 1,
  totalStoryPoints: 8, completedStoryPoints: 5, targetSprintId: null, targetSprintName: null,
  tickets: tickets.slice(0, 2),
} } as ApiSprint
const props = () => ({ sprint, sprints: [sprint, next], tickets, onOpenChange: jest.fn(), onCompleted: jest.fn() })

beforeEach(() => jest.resetAllMocks())

it('defaults to backlog and calls completion only after confirmation', async () => {
  jest.mocked(completeSprint).mockResolvedValue(completed)
  const callbacks = props()
  render(<CompleteSprintDialog {...callbacks} />)
  expect(completeSprint).not.toHaveBeenCalled()
  expect(screen.getByLabelText('Mover tickets pendientes a')).toHaveValue('backlog')
  fireEvent.click(screen.getByRole('button', { name: 'Finalizar sprint' }))
  await waitFor(() => expect(callbacks.onCompleted).toHaveBeenCalledWith(completed))
  expect(completeSprint).toHaveBeenCalledWith('project', 'current', null)
  expect(callbacks.onOpenChange).toHaveBeenCalledWith(false)
})

it('offers only open sprints in this project and sends the chosen destination', async () => {
  jest.mocked(completeSprint).mockResolvedValue(completed)
  render(<CompleteSprintDialog {...props()} sprints={[sprint, next, { ...next, id: 'closed', name: 'Cerrado', completedAt: '2026-10-20' }, { ...next, id: 'foreign', projectId: 'foreign', name: 'Privado' }]} />)
  expect(screen.queryByRole('option', { name: 'Cerrado' })).not.toBeInTheDocument()
  expect(screen.queryByRole('option', { name: 'Privado' })).not.toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Mover tickets pendientes a'), { target: { value: 'next' } })
  fireEvent.click(screen.getByRole('button', { name: 'Finalizar sprint' }))
  await waitFor(() => expect(completeSprint).toHaveBeenCalledWith('project', 'current', 'next'))
})

it('displays errors, keeps the dialog open and permits retry', async () => {
  jest.mocked(completeSprint).mockRejectedValue(new Error('El sprint ya está finalizado'))
  const callbacks = props()
  render(<CompleteSprintDialog {...callbacks} />)
  fireEvent.click(screen.getByRole('button', { name: 'Finalizar sprint' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('El sprint ya está finalizado')
  expect(callbacks.onCompleted).not.toHaveBeenCalled()
  expect(callbacks.onOpenChange).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: 'Finalizar sprint' })).toBeEnabled()
})

it('prevents duplicate requests and dismissal while saving', async () => {
  let resolve!: (value: ApiSprint) => void
  jest.mocked(completeSprint).mockImplementation(() => new Promise(done => { resolve = done }))
  render(<CompleteSprintDialog {...props()} />)
  fireEvent.click(screen.getByRole('button', { name: 'Finalizar sprint' }))
  fireEvent.click(screen.getByRole('button', { name: 'Finalizar sprint' }))
  expect(completeSprint).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  await act(async () => resolve(completed))
})

it('allows closing an empty sprint without a destination selector', async () => {
  jest.mocked(completeSprint).mockResolvedValue(completed)
  render(<CompleteSprintDialog {...props()} tickets={[]} />)
  expect(screen.queryByLabelText('Mover tickets pendientes a')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Finalizar sprint' }))
  await waitFor(() => expect(completeSprint).toHaveBeenCalledWith('project', 'current', null))
})

it('keeps the historical status after a moved ticket changes and opens its current detail', () => {
  const onTicketClick = jest.fn()
  const current = { ...tickets[1], status: 'done' as const, sprintId: 'next' }
  render(<CompletedSprints sprints={[completed, next]} tickets={[current]} onTicketClick={onTicketClick} />)
  expect(screen.getByText('En progreso · Movido')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'P-2 · Pendiente', hidden: true }))
  expect(onTicketClick).toHaveBeenCalledWith(current)
  expect(screen.queryByText('Próximo sprint')).not.toBeInTheDocument()
})
