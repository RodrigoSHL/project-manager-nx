import * as React from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { WorkspaceMember } from '@/services/userService'
import { WorkspaceMembersTable } from './workspace-members-table'

function makeMembers(count: number): WorkspaceMember[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `membership-${index + 1}`, workspaceId: 'workspace-1', userId: `user-${index + 1}`,
    role: index % 2 === 0 ? 'member' : 'viewer', joinedAt: '2026-10-19',
    user: {
      id: `user-${index + 1}`, name: `Persona ${String(index + 1).padStart(2, '0')}`,
      email: `persona.${index + 1}@example.com`, roles: ['user'],
      createdAt: '2026-10-19', updatedAt: '2026-10-19',
    },
  }))
}

async function chooseOption(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
  fireEvent.keyDown(screen.getByRole('combobox', { name: label }), { key: 'ArrowDown' })
  await user.click(await screen.findByRole('option', { name: option }))
}

function renderTable(members = makeMembers(23)) {
  const onEditRole = jest.fn()
  const onRemoveMember = jest.fn().mockResolvedValue(undefined)
  const result = render(<WorkspaceMembersTable members={members} onEditRole={onEditRole} onRemoveMember={onRemoveMember} />)
  return { ...result, onEditRole, onRemoveMember }
}

function renderRemovalTable(initialMembers: WorkspaceMember[], remove: (id: string) => Promise<void>) {
  function InteractiveTable() {
    const [members, setMembers] = React.useState(initialMembers)
    return <WorkspaceMembersTable members={members} onEditRole={jest.fn()} onRemoveMember={async id => {
      await remove(id)
      setMembers(previous => previous.filter(member => member.userId !== id))
    }} />
  }
  return render(<InteractiveTable />)
}

describe('workspace member directory', () => {
  beforeAll(() => {
    HTMLElement.prototype.scrollIntoView = jest.fn()
    HTMLElement.prototype.hasPointerCapture = jest.fn().mockReturnValue(false)
    HTMLElement.prototype.releasePointerCapture = jest.fn()
  })

  it('shows ten members per page and navigates to a partial last page', async () => {
    const user = userEvent.setup()
    renderTable()
    const table = screen.getByRole('table', { name: 'Miembros del workspace' })
    expect(within(table).getAllByRole('button', { name: /Editar rol de/ })).toHaveLength(10)
    expect(screen.getByText('1–10 de 23')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Página anterior de miembros' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Página siguiente de miembros' }))
    expect(screen.getByText('Persona 11')).toBeInTheDocument()
    expect(screen.queryByText('Persona 01')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Página siguiente de miembros' }))
    expect(within(table).getAllByRole('button', { name: /Editar rol de/ })).toHaveLength(3)
    expect(screen.getByText('21–23 de 23')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Página siguiente de miembros' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Página anterior de miembros' }))
    expect(screen.getByText('11–20 de 23')).toBeInTheDocument()
  })

  it('combines accent-insensitive search and roles, resets the page and recovers from no matches', async () => {
    const user = userEvent.setup()
    const members = makeMembers(23)
    const memberUser = members[22].user
    if (memberUser) memberUser.name = 'Álvaro Núñez'
    renderTable(members)
    await user.click(screen.getByRole('button', { name: 'Página siguiente de miembros' }))
    const search = screen.getByRole('searchbox', { name: 'Buscar miembros' })
    await user.type(search, 'ALVARO NUNEZ')
    expect(screen.getByText('Álvaro Núñez')).toBeInTheDocument()
    expect(screen.getByText('1 / 1')).toBeInTheDocument()
    await chooseOption(user, 'Filtrar miembros por rol', 'Viewer')
    expect(screen.getByText('No se encontraron miembros')).toBeInTheDocument()
    expect(screen.queryByText('Álvaro Núñez')).not.toBeInTheDocument()
    await user.clear(search)
    await user.type(search, 'PERSONA.12@EXAMPLE.COM')
    expect(screen.getByText('Persona 12')).toBeInTheDocument()
    expect(screen.getByText('1–1 de 1 · 23 en total')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(search).toHaveValue('')
    expect(screen.getByRole('combobox', { name: 'Filtrar miembros por rol' })).toHaveTextContent('Todos los roles')
    expect(screen.getByText('1–10 de 23')).toBeInTheDocument()
  })

  it('changes page size and keeps role editing available on later pages', async () => {
    const user = userEvent.setup()
    const { onEditRole } = renderTable()
    await user.click(screen.getByRole('button', { name: 'Página siguiente de miembros' }))
    await user.click(screen.getByRole('button', { name: 'Editar rol de Persona 12' }))
    expect(onEditRole).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-12' }))
    await chooseOption(user, 'Miembros por página', '25 por página')
    expect(screen.getByText('1–23 de 23')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Editar rol de/ })).toHaveLength(23)
    expect(screen.getByText('1 / 1')).toBeInTheDocument()
  })

  it('returns to the previous page when its last member is removed', async () => {
    const user = userEvent.setup()
    const remove = jest.fn().mockResolvedValue(undefined)
    renderRemovalTable(makeMembers(11), remove)
    await user.click(screen.getByRole('button', { name: 'Página siguiente de miembros' }))
    await user.click(screen.getByRole('button', { name: 'Eliminar a Persona 11 del workspace' }))
    await waitFor(() => expect(screen.getByText('1–10 de 10')).toBeInTheDocument())
    expect(remove).toHaveBeenCalledWith('user-11')
    expect(screen.queryByText('Persona 11')).not.toBeInTheDocument()
    expect(screen.getByText('1 / 1')).toBeInTheDocument()
  })

  it('keeps a member visible when removal fails and permits retrying', async () => {
    const user = userEvent.setup()
    const remove = jest.fn().mockRejectedValueOnce(new Error('No se pudo eliminar')).mockResolvedValueOnce(undefined)
    renderRemovalTable(makeMembers(2), remove)
    await user.click(screen.getByRole('button', { name: 'Eliminar a Persona 01 del workspace' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo eliminar')
    expect(screen.getByText('Persona 01')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Eliminar a Persona 01 del workspace' }))
    await waitFor(() => expect(screen.queryByText('Persona 01')).not.toBeInTheDocument())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('updates a filtered page when an edited member no longer matches the role', async () => {
    const user = userEvent.setup()
    const members = makeMembers(11).map(member => ({ ...member, role: 'viewer' as const }))
    const { rerender, onEditRole, onRemoveMember } = renderTable(members)
    await chooseOption(user, 'Filtrar miembros por rol', 'Viewer')
    await user.click(screen.getByRole('button', { name: 'Página siguiente de miembros' }))
    rerender(<WorkspaceMembersTable members={members.map(member => member.userId === 'user-11' ? { ...member, role: 'member' } : member)} onEditRole={onEditRole} onRemoveMember={onRemoveMember} />)
    expect(screen.queryByText('Persona 11')).not.toBeInTheDocument()
    expect(screen.getByText('1–10 de 10 · 11 en total')).toBeInTheDocument()
    expect(screen.getByText('1 / 1')).toBeInTheDocument()
  })
})
