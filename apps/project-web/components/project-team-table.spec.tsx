import * as React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectTeamTable } from './project-team-table'
import { EditTeamMembersDialog } from './edit-team-members-dialog'
import { ProjectService } from '@/services/projectService'
import { WorkspaceService } from '@/services/userService'
import type { Project, TeamMember } from '@/types/project'

jest.mock('@/contexts/workspace-context', () => ({ useWorkspace: () => ({ selectedWorkspace: { id: 'workspace-1', name: 'Workspace Uno' } }) }))
jest.mock('@/services/projectService', () => ({ ProjectService: { granularUpdateProject: jest.fn() } }))
jest.mock('@/services/userService', () => ({ WorkspaceService: { getMembers: jest.fn() } }))

const members: TeamMember[] = Array.from({ length: 12 }, (_, index) => ({
  id: `member-${index + 1}`, userId: `user-${index + 1}`, name: `Persona ${String(index + 1).padStart(2, '0')}`,
  email: `persona.${index + 1}@example.com`, role: index === 11 ? 'qa' : 'member',
  createdAt: new Date('2026-10-27'), updatedAt: new Date('2026-10-27'),
}))
const project = { id: 'project-1', name: 'Proyecto Uno', teamMembers: members } as Project

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = jest.fn()
  HTMLElement.prototype.hasPointerCapture = jest.fn().mockReturnValue(false)
  HTMLElement.prototype.releasePointerCapture = jest.fn()
})
beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(WorkspaceService.getMembers).mockResolvedValue([])
})

it('offers the same directory for project readers without administration controls', async () => {
  const user = userEvent.setup()
  render(<ProjectTeamTable members={members} />)
  expect(screen.getByRole('table', { name: 'Equipo responsable' })).toBeInTheDocument()
  expect(screen.getByText('1–10 de 12')).toBeInTheDocument()
  expect(screen.queryByRole('columnheader', { name: 'Acciones' })).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Página siguiente de participantes' }))
  expect(screen.getByText('Persona 12')).toBeInTheDocument()
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Filtrar participantes por rol' }), { key: 'ArrowDown' })
  await user.click(await screen.findByRole('option', { name: 'QA' }))
  expect(screen.getByText('1–1 de 1 · 12 en total')).toBeInTheDocument()
  expect(screen.getByText('Persona 12')).toBeInTheDocument()
  expect(screen.queryByRole('combobox', { name: /Rol de Persona/ })).not.toBeInTheDocument()
})

it('saves edits and removals from later pages without losing off-page members', async () => {
  const user = userEvent.setup()
  const onSave = jest.fn()
  const onOpenChange = jest.fn()
  jest.mocked(ProjectService.granularUpdateProject).mockResolvedValue(project)
  render(<EditTeamMembersDialog project={project} open onOpenChange={onOpenChange} onSave={onSave} />)
  await screen.findByText('No hay miembros en el workspace.')
  await user.click(screen.getByRole('button', { name: 'Página siguiente de participantes' }))
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Rol de Persona 12' }), { key: 'ArrowDown' })
  await user.click(await screen.findByRole('option', { name: 'Developer' }))
  await user.click(screen.getByRole('button', { name: 'Quitar a Persona 11 del proyecto' }))
  await user.click(screen.getByRole('button', { name: 'Guardar' }))
  await waitFor(() => expect(onSave).toHaveBeenCalledWith(project))
  const [id, payload] = jest.mocked(ProjectService.granularUpdateProject).mock.calls[0]
  expect(id).toBe(project.id)
  expect(payload.teamMembers?.add).toEqual([])
  expect(payload.teamMembers?.delete).toEqual(['member-11'])
  expect(payload.teamMembers?.update).toHaveLength(11)
  expect(payload.teamMembers?.update).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: 'member-1', userId: 'user-1', role: 'member' }),
    expect.objectContaining({ id: 'member-12', userId: 'user-12', role: 'developer' }),
  ]))
  expect(onOpenChange).toHaveBeenCalledWith(false)
})

it('adds a workspace participant with their account identity and selected team role', async () => {
  const user = userEvent.setup()
  jest.mocked(WorkspaceService.getMembers).mockResolvedValue([{ id: 'membership-new', userId: 'new-user', workspaceId: 'workspace-1', role: 'viewer', joinedAt: '2026-10-27', user: { id: 'new-user', name: 'Nueva Persona', email: 'nueva@example.com', roles: ['user'], createdAt: '2026-10-27', updatedAt: '2026-10-27' } }])
  jest.mocked(ProjectService.granularUpdateProject).mockResolvedValue(project)
  render(<EditTeamMembersDialog project={project} open onOpenChange={jest.fn()} onSave={jest.fn()} />)
  const picker = await screen.findByRole('combobox', { name: 'Miembro del workspace' })
  fireEvent.keyDown(picker, { key: 'ArrowDown' })
  await user.click(await screen.findByRole('option', { name: /Nueva Persona/ }))
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Rol del nuevo participante' }), { key: 'ArrowDown' })
  await user.click(await screen.findByRole('option', { name: 'Miembro' }))
  await user.click(screen.getByRole('button', { name: 'Añadir participante al proyecto' }))
  await user.click(screen.getByRole('button', { name: 'Guardar' }))
  await waitFor(() => expect(ProjectService.granularUpdateProject).toHaveBeenCalled())
  expect(jest.mocked(ProjectService.granularUpdateProject).mock.calls[0][1].teamMembers?.add).toEqual([
    { userId: 'new-user', name: 'Nueva Persona', email: 'nueva@example.com', role: 'member' },
  ])
})
