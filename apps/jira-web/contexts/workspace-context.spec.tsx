import * as React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { WorkspaceProvider, useWorkspace } from './workspace-context'
import { WorkspaceService } from '@/services/userService'
import { usePathname } from 'next/navigation'

jest.mock('next/navigation', () => ({ usePathname: jest.fn(() => '/') }))
jest.mock('@/services/userService', () => ({ WorkspaceService: { getAll: jest.fn() } }))
const id = '00000000-0000-4000-8000-000000000001'
const otherId = '00000000-0000-4000-8000-000000000002'
function Selection() {
  const { selectedWorkspace } = useWorkspace()
  return <span data-testid="workspace">{selectedWorkspace?.id}</span>
}
describe('workspace selection from a mention email', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('jira-web:workspaceId', otherId)
    window.history.replaceState({}, '', '/?' + new URLSearchParams({ workspaceId: id, projectId: id, ticketId: id, commentId: id }))
  })
  it('prefers the linked workspace when the user has access', async () => {
    jest.mocked(WorkspaceService.getAll).mockResolvedValue([{ id }, { id: otherId }] as never)
    render(<WorkspaceProvider><Selection /></WorkspaceProvider>)
    await waitFor(() => expect(screen.getByTestId('workspace')).toHaveTextContent(id))
  })
  it('ignores a linked workspace absent from the authenticated list', async () => {
    jest.mocked(WorkspaceService.getAll).mockResolvedValue([{ id: otherId }] as never)
    render(<WorkspaceProvider><Selection /></WorkspaceProvider>)
    await waitFor(() => expect(screen.getByTestId('workspace')).toHaveTextContent(otherId))
  })

  it('selects the authorized workspace when returning from a ticket page through client navigation', async () => {
    window.history.replaceState({}, '', '/projects/project-1/tickets/ticket-1')
    jest.mocked(usePathname).mockReturnValue('/projects/project-1/tickets/ticket-1')
    jest.mocked(WorkspaceService.getAll).mockResolvedValue([{ id }, { id: otherId }] as never)
    const view = render(<WorkspaceProvider><Selection /></WorkspaceProvider>)
    await waitFor(() => expect(screen.getByTestId('workspace')).toHaveTextContent(otherId))
    window.history.replaceState({}, '', '/?' + new URLSearchParams({ workspaceId: id, projectId: id }))
    jest.mocked(usePathname).mockReturnValue('/')
    view.rerender(<WorkspaceProvider><Selection /></WorkspaceProvider>)
    await waitFor(() => expect(screen.getByTestId('workspace')).toHaveTextContent(id))
  })
})
