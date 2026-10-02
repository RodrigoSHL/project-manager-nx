import * as React from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WorkspaceService, UserService, type Workspace, type WorkspaceMember } from '@/services/userService'
import { ProjectService } from '@/services/projectService'
import { WorkspacesTab } from './workspaces-tab'

jest.mock('@/services/userService', () => ({
  WorkspaceService: { getAll: jest.fn(), getMembers: jest.fn(), updateMemberRole: jest.fn() },
  UserService: { getAll: jest.fn() },
}))
jest.mock('@/services/projectService', () => ({
  ProjectService: { getAllProjects: jest.fn(), getProjectsByWorkspace: jest.fn() },
}))
jest.mock('@/components/edit-team-members-dialog', () => ({ EditTeamMembersDialog: () => null }))

const workspace: Workspace = {
  id: 'workspace-1', name: 'Workspace Uno', slug: 'workspace-uno',
  createdAt: '2026-10-02', updatedAt: '2026-10-02',
}
const member: WorkspaceMember = {
  id: 'membership-1', workspaceId: workspace.id, userId: 'user-1', role: 'member',
  joinedAt: '2026-10-02',
  user: {
    id: 'user-1', name: 'Persona Uno', email: 'persona@example.com', roles: ['user'],
    createdAt: '2026-10-02', updatedAt: '2026-10-02',
  },
}

async function openEditor() {
  const user = userEvent.setup()
  render(<WorkspacesTab />)
  await user.click(await screen.findByRole('button', { name: /Workspace Uno/ }))
  await user.click(await screen.findByRole('button', { name: 'Editar rol de Persona Uno' }))
  return user
}

async function chooseViewer(user: ReturnType<typeof userEvent.setup>) {
  const select = screen.getByRole('combobox', { name: 'Rol' })
  // Keyboard interaction opens the actual Radix menu in jsdom.
  fireEvent.keyDown(select, { key: 'ArrowDown' })
  expect(await screen.findAllByRole('option')).toHaveLength(4)
  await user.click(screen.getByRole('option', { name: 'Viewer' }))
}

describe('workspace member role editor', () => {
  beforeAll(() => {
    HTMLElement.prototype.scrollIntoView = jest.fn()
    HTMLElement.prototype.hasPointerCapture = jest.fn().mockReturnValue(false)
    HTMLElement.prototype.releasePointerCapture = jest.fn()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(WorkspaceService.getAll).mockResolvedValue([workspace])
    jest.mocked(WorkspaceService.getMembers).mockResolvedValue([member])
    jest.mocked(UserService.getAll).mockResolvedValue([])
    jest.mocked(ProjectService.getAllProjects).mockResolvedValue([])
    jest.mocked(ProjectService.getProjectsByWorkspace).mockResolvedValue([])
  })

  it('preselects the current role and saves only after explicit confirmation', async () => {
    let finishSave!: (value: WorkspaceMember) => void
    jest.mocked(WorkspaceService.updateMemberRole).mockReturnValue(new Promise(resolve => { finishSave = resolve }))
    const user = await openEditor()
    expect(screen.getByRole('combobox', { name: 'Rol' })).toHaveTextContent('Member')
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()

    await chooseViewer(user)
    expect(WorkspaceService.updateMemberRole).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(WorkspaceService.updateMemberRole).toHaveBeenCalledWith(workspace.id, member.userId, 'viewer')
    expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()

    // The API response need not include the user relation: keep the displayed identity.
    await act(async () => { finishSave({ ...member, user: undefined, role: 'viewer' }) })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const row = screen.getByText('persona@example.com').closest('.group') as HTMLElement
    expect(within(row).getByText('Viewer')).toBeInTheDocument()
    expect(within(row).getByText('Persona Uno')).toBeInTheDocument()
  })

  it('cancels without persisting or changing the current badge', async () => {
    const user = await openEditor()
    await chooseViewer(user)
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(WorkspaceService.updateMemberRole).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Member')).toBeInTheDocument()
  })

  it('keeps the original role on failure and allows retrying the selected value', async () => {
    jest.mocked(WorkspaceService.updateMemberRole)
      .mockRejectedValueOnce(new Error('No se pudo guardar'))
      .mockResolvedValueOnce({ ...member, role: 'viewer' })
    const user = await openEditor()
    await chooseViewer(user)
    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar')
    expect(screen.getByText('Member')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Rol' })).toHaveTextContent('Viewer')

    await user.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(WorkspaceService.updateMemberRole).toHaveBeenCalledTimes(2)
    expect(screen.getByText('Viewer')).toBeInTheDocument()
  })
})
