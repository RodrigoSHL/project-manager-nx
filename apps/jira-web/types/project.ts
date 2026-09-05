export interface ApiProject {
  id: string
  name: string
  key: string | null
  color: string | null
  workspaceId: string | null
  shortName: string | null
  businessUnit: string
  description: string
  status: 'planning' | 'development' | 'testing' | 'staging' | 'production' | 'maintenance' | 'deprecated'
  priority: 'low' | 'medium' | 'high' | 'critical'
  version: string | null
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
}

export interface ApiSprint {
  id: string
  projectId: string
  name: string
  goal: string | null
  startDate: string | null
  endDate: string | null
  isActive: boolean
  createdAt: string
}

export interface ApiLabel {
  id: string
  name: string
  color: string | null
}

export interface ApiComment {
  id: string
  ticketId: string
  authorId: string
  body: string
  createdAt: string
  updatedAt: string
}

export interface ApiTicketAttachment {
  id: string
  application: 'jira-web'
  ownerType: 'ticket'
  ownerId: string
  originalName: string
  mimeType: string
  size: number
  metadata: {
    category: 'ticket-attachment'
    projectId: string
    ticketKey?: string
    uploadedBy?: string
  }
  createdAt: string
  updatedAt: string
}

export interface ApiTeamMember {
  id: string
  name: string
  email: string
  role: string
  userId: string | null
  avatar?: string
  projectId: string
  isActive?: boolean
}

export interface ApiSupportDetail {
  id: string
  ticketId: string
  clientContact: string | null
  ufValue: number | null
  isBillable: boolean
  billedAt: string | null
  invoiceRef: string | null
  slaDeadline: string | null
  resolvedAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface ApiTicket {
  id: string
  key: string
  projectId: string
  sprintId: string | null
  title: string
  description: string | null
  acceptanceCriteria: string | null
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled'
  priority: 'lowest' | 'low' | 'medium' | 'high' | 'urgent'
  type: 'story' | 'bug' | 'task' | 'epic' | 'subtask' | 'support'
  assigneeId: string | null
  reporterId: string | null
  storyPoints: number | null
  dueDate: string | null
  createdAt: string
  updatedAt: string
  labels: ApiLabel[]
  supportDetail?: ApiSupportDetail | null
}
