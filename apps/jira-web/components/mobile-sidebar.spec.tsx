import * as React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MobileSidebar } from './mobile-sidebar'
import { useWorkspace } from '@/contexts/workspace-context'
import type { ApiProject } from '@/types/project'

jest.mock('@/contexts/workspace-context', () => ({ useWorkspace: jest.fn() }))

const project = { id: 'project-1', name: 'Proyecto autorizado', workspaceId: 'workspace-1' } as ApiProject
const props = () => ({
  open: true, onClose: jest.fn(), activeView: 'tickets', onViewChange: jest.fn(),
  currentProject: project.id, onProjectChange: jest.fn(), projects: [project],
})

beforeEach(() => {
  jest.mocked(useWorkspace).mockReturnValue({
    workspaces: [{ id: 'workspace-1', name: 'Empresa actual' }],
    selectedWorkspace: { id: 'workspace-1', name: 'Empresa actual' },
    setSelectedWorkspace: jest.fn(),
  } as never)
})

it('shows the real workspace and project and closes after selecting the project', () => {
  const callbacks = props()
  render(<MobileSidebar {...callbacks} />)
  expect(screen.getByText('Empresa actual')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Proyecto autorizado' }))
  expect(callbacks.onProjectChange).toHaveBeenCalledWith(project.id)
  expect(callbacks.onClose).toHaveBeenCalled()
})

it('uses the same section navigation as the desktop sidebar', () => {
  const callbacks = props()
  render(<MobileSidebar {...callbacks} />)
  expect(screen.getByRole('button', { name: 'Soportes' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Backlog' }))
  expect(callbacks.onViewChange).toHaveBeenCalledWith('backlog')
  expect(callbacks.onClose).toHaveBeenCalled()
})

it('provides a visible close control for the mobile navigation', () => {
  const callbacks = props()
  render(<MobileSidebar {...callbacks} />)
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar menú' }))
  expect(callbacks.onClose).toHaveBeenCalled()
})
