'use client'

import * as React from 'react'
import type { ApiProject, ApiSprint, ApiTeamMember, ApiTicket } from '@/types/project'

export interface ProjectContextValue {
  project: ApiProject | null
  tickets: ApiTicket[]
  sprints: ApiSprint[]
  teamMembers: ApiTeamMember[]
  canWrite: boolean
  loading: boolean
  error: string | null
  reload: () => void
  onTicketUpdated: (ticket: ApiTicket) => void
  onTicketDeleted: (ticketId: string) => void
  onCreateChild: (parent: ApiTicket) => void
}

export const ProjectContext = React.createContext<ProjectContextValue | null>(null)

export function useProject() {
  const context = React.useContext(ProjectContext)
  if (!context) throw new Error('useProject must be used within ProjectManagement')
  return context
}
