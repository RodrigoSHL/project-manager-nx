import * as React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { TopBar } from './top-bar'

jest.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: { name: 'Test User', email: 'test@example.invalid', roles: ['user'] }, logout: jest.fn() }),
}))
jest.mock('@/components/theme-toggle', () => ({ ThemeToggle: () => null }))

const projects = [
  { id: 'first', name: 'ServiuPRO Ingreso de Proyectos con un nombre largo', color: '#a78bfa' },
  { id: 'second', name: 'ServiuPRO Pavimento', color: '#54b8a0' },
]
const props = {
  onMenuClick: jest.fn(), isMobile: false, onProjectChange: jest.fn(),
  onCreateTicket: jest.fn(), canWrite: true, searchQuery: '', onSearchChange: jest.fn(),
  filters: { assignee: 'all', status: 'all', priority: 'all' }, onFilterChange: jest.fn(),
  projects: projects as never,
}

it('shows one project color indicator and keeps the selected name when the project changes', async () => {
  const { rerender } = render(<TopBar {...props} currentProject="first" />)
  const selector = screen.getByRole('combobox', { name: 'Seleccionar proyecto' })
  await waitFor(() => expect(selector).toHaveTextContent(projects[0].name))
  expect(selector.querySelectorAll('[style*="background-color"]')).toHaveLength(1)

  rerender(<TopBar {...props} currentProject="second" />)
  await waitFor(() => expect(selector).toHaveTextContent(projects[1].name))
  expect(selector).not.toHaveTextContent(projects[0].name)
  expect(selector.querySelectorAll('[style*="background-color"]')).toHaveLength(1)
  expect(selector.querySelector('[style*="background-color"]')).toHaveStyle({ backgroundColor: projects[1].color })
})
