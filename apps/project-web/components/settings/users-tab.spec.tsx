import * as React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UsersTab } from './users-tab'
import { UserService, type User } from '@/services/userService'

jest.mock('@/services/userService', () => ({ UserService: { getAll: jest.fn(), create: jest.fn(), remove: jest.fn() } }))

const users: User[] = Array.from({ length: 23 }, (_, index) => ({
  id: `user-${index + 1}`, name: index === 22 ? 'Álvaro Núñez' : `Persona ${String(index + 1).padStart(2, '0')}`,
  email: `persona.${index + 1}@example.com`, roles: index === 22 ? ['user', 'admin'] : ['user'],
  createdAt: '2026-10-27', updatedAt: '2026-10-27',
}))

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = jest.fn()
  HTMLElement.prototype.hasPointerCapture = jest.fn().mockReturnValue(false)
  HTMLElement.prototype.releasePointerCapture = jest.fn()
})
beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(UserService.getAll).mockResolvedValue(users)
})

it('shows paginated users and filters identities with accents and multiple global roles', async () => {
  const user = userEvent.setup()
  render(<UsersTab />)
  const table = await screen.findByRole('table', { name: 'Usuarios del sistema' })
  expect(within(table).getAllByRole('button', { name: /Ver detalle de/ })).toHaveLength(10)
  await user.click(screen.getByRole('button', { name: 'Página siguiente de usuarios' }))
  expect(screen.getByText('Persona 11')).toBeInTheDocument()
  await user.type(screen.getByRole('searchbox', { name: 'Buscar usuarios' }), 'ALVARO NUNEZ')
  expect(screen.getByText('Álvaro Núñez')).toBeInTheDocument()
  expect(screen.getByText('1–1 de 1 · 23 en total')).toBeInTheDocument()
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Filtrar usuarios por rol' }), { key: 'ArrowDown' })
  await user.click(await screen.findByRole('option', { name: 'Administrador' }))
  expect(screen.getByText('Álvaro Núñez')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Ver detalle de Álvaro Núñez' }))
  expect(screen.getByText('Detalle del usuario')).toBeInTheDocument()
})

it('retains a user after a failed deletion and recovers when retrying on the last page', async () => {
  const user = userEvent.setup()
  jest.mocked(UserService.getAll).mockResolvedValue(users.slice(0, 11))
  jest.mocked(UserService.remove).mockRejectedValueOnce(new Error('No se pudo eliminar')).mockResolvedValueOnce(undefined)
  render(<UsersTab />)
  await screen.findByRole('table', { name: 'Usuarios del sistema' })
  await user.click(screen.getByRole('button', { name: 'Página siguiente de usuarios' }))
  await user.click(screen.getByRole('button', { name: 'Eliminar usuario Persona 11' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo eliminar')
  expect(screen.getByText('Persona 11')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Eliminar usuario Persona 11' }))
  await waitFor(() => expect(screen.getByText('1–10 de 10')).toBeInTheDocument())
  expect(UserService.remove).toHaveBeenCalledWith('user-11')
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

it('keeps user creation available and adds the new account to the directory', async () => {
  const user = userEvent.setup()
  jest.mocked(UserService.create).mockResolvedValue({ ...users[0], id: 'new-user', name: 'Nueva Persona', email: 'nueva@example.com' })
  render(<UsersTab />)
  await user.click(await screen.findByRole('button', { name: 'Nuevo usuario' }))
  const dialog = screen.getByRole('dialog')
  await user.type(within(dialog).getByLabelText('Nombre completo'), 'Nueva Persona')
  await user.type(within(dialog).getByLabelText('Email'), 'nueva@example.com')
  await user.type(within(dialog).getByLabelText('Contraseña inicial'), 'test-password')
  await user.type(within(dialog).getByLabelText('Confirmar contraseña'), 'test-password')
  await user.click(within(dialog).getByRole('button', { name: 'Crear usuario' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(screen.getByText('Nueva Persona')).toBeInTheDocument()
  expect(screen.getByText('1–10 de 24')).toBeInTheDocument()
  expect(UserService.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Nueva Persona', email: 'nueva@example.com', roles: ['user'] }))
})
