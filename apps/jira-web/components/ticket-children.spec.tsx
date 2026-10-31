import * as React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { TicketChildren } from './ticket-children'
import type { ApiTicket } from '@/types/project'

const epic = { id: 'epic-1', projectId: 'project-1', type: 'epic' } as ApiTicket
const story = { id: 'story-1', projectId: 'project-1', type: 'story', epicId: 'epic-1', key: 'P-2', title: 'Historia', status: 'todo' } as ApiTicket
const subtask = { ...story, id: 'subtask-1', type: 'subtask' as const, epicId: null, parentTicketId: 'story-1', key: 'P-3', title: 'Implementar validación', status: 'in_progress' as const }

it('shows stories and subtasks using the same ticket list and navigates to the selected child', () => {
  const onSelect = jest.fn()
  const onCreate = jest.fn()
  const props = { tickets: [epic, story, subtask], onSelect, onCreate }
  const view = render(<TicketChildren {...props} ticket={epic} />)
  const epicRegion = screen.getByRole('region', { name: 'Historias de usuario' })
  fireEvent.click(within(epicRegion).getByRole('button', { name: /P-2 Historia/ }))
  expect(onSelect).toHaveBeenCalledWith(story)
  expect(within(epicRegion).queryByText(subtask.title)).not.toBeInTheDocument()
  view.rerender(<TicketChildren {...props} ticket={story} />)
  const storyRegion = screen.getByRole('region', { name: 'Subtareas' })
  fireEvent.click(within(storyRegion).getByRole('button', { name: /P-3 Implementar validación in_progress/ }))
  expect(onSelect).toHaveBeenCalledWith(subtask)
  fireEvent.click(within(storyRegion).getByRole('button', { name: 'Crear subtarea' }))
  expect(onCreate).toHaveBeenCalledTimes(1)
})

it('only includes subtasks of this story in the same project and hides creation from readers', () => {
  render(<TicketChildren ticket={story} tickets={[subtask, { ...subtask, id: 'other', parentTicketId: 'another-story', title: 'Other story' }, { ...subtask, id: 'foreign', projectId: 'other-project', title: 'Private project' }, { ...subtask, id: 'task', type: 'task', title: 'Ordinary task' }]} onSelect={jest.fn()} />)
  expect(screen.getAllByRole('button')).toHaveLength(1)
  expect(screen.getByText(subtask.title)).toBeInTheDocument()
  expect(screen.queryByText('Private project')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Crear subtarea' })).not.toBeInTheDocument()
})

it('offers creation from an empty story and does not treat subtasks as parents', () => {
  const view = render(<TicketChildren ticket={story} tickets={[]} onSelect={jest.fn()} onCreate={jest.fn()} />)
  expect(screen.getByText('Esta historia aún no tiene subtareas vinculadas.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Crear subtarea' })).toBeEnabled()
  view.rerender(<TicketChildren ticket={subtask} tickets={[]} onSelect={jest.fn()} />)
  expect(screen.queryByRole('region')).not.toBeInTheDocument()
})
