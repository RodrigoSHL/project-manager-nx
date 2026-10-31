import * as React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { CreateTicketDialog } from './create-ticket-dialog'
import { createTicket } from '@/services/ticketService'
import type { ApiTicket } from '@/types/project'

jest.mock('@/services/ticketService', () => ({ createTicket: jest.fn() }))
const story = { id: 'story-1', projectId: 'project-1', key: 'P-1', title: 'Historia de usuario', type: 'story' } as ApiTicket
const props = () => ({ open: true, onOpenChange: jest.fn(), projectId: 'project-1', sprints: [], availableStories: [story], initialType: 'subtask' as const, initialParentTicketId: story.id, onCreated: jest.fn() })
beforeEach(() => jest.resetAllMocks())

it('creates a subtask with its parent story preselected', async () => {
  const callbacks = props()
  const subtask = { ...story, id: 'child-1', type: 'subtask' as const, parentTicketId: story.id }
  jest.mocked(createTicket).mockResolvedValue(subtask)
  render(<CreateTicketDialog {...callbacks} />)
  expect(screen.getByRole('combobox', { name: 'Historia de usuario *' })).toHaveTextContent('P-1 · Historia de usuario')
  fireEvent.change(screen.getByLabelText('Título *'), { target: { value: 'Validar formulario' } })
  fireEvent.click(screen.getByRole('button', { name: 'Crear ticket' }))
  await waitFor(() => expect(callbacks.onCreated).toHaveBeenCalledWith(subtask))
  expect(createTicket).toHaveBeenCalledWith('project-1', expect.objectContaining({ type: 'subtask', parentTicketId: story.id, epicId: null }))
})

it.each([null, 'foreign-story'])('requires an available parent story before creating a subtask (%s)', async parent => {
  render(<CreateTicketDialog {...props()} initialParentTicketId={parent} />)
  fireEvent.change(screen.getByLabelText('Título *'), { target: { value: 'Subtarea' } })
  fireEvent.click(screen.getByRole('button', { name: 'Crear ticket' }))
  expect(await screen.findByText('Selecciona la historia de usuario a la que pertenece la subtarea.')).toBeInTheDocument()
  expect(createTicket).not.toHaveBeenCalled()
})
