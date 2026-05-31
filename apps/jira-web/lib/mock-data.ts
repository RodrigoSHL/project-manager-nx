export type TicketStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketType = 'task' | 'bug' | 'story' | 'epic' | 'subtask' | 'support'

export interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: string
}

export interface Workspace {
  id: string
  name: string
  slug: string
}

export interface Project {
  id: string
  name: string
  key: string
  workspaceId: string
  color: string
}

export interface Sprint {
  id: string
  name: string
  projectId: string
  startDate: string
  endDate: string
  goal: string
  isActive: boolean
}

export interface Comment {
  id: string
  ticketId: string
  userId: string
  content: string
  createdAt: string
}

export interface Ticket {
  id: string
  key: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  type: TicketType
  assigneeId: string | null
  reporterId: string
  watcherIds: string[]
  labels: string[]
  sprintId: string | null
  projectId: string
  storyPoints: number | null
  createdAt: string
  updatedAt: string
  subtasks: { id: string; title: string; completed: boolean }[]
}

export const users: User[] = [
  { id: 'u1', name: 'Ana García', email: 'ana@flowboard.io', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana', role: 'Product Manager' },
  { id: 'u2', name: 'Carlos Ruiz', email: 'carlos@flowboard.io', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos', role: 'Frontend Developer' },
  { id: 'u3', name: 'María López', email: 'maria@flowboard.io', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria', role: 'Backend Developer' },
  { id: 'u4', name: 'Pedro Sánchez', email: 'pedro@flowboard.io', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro', role: 'UX Designer' },
  { id: 'u5', name: 'Laura Martín', email: 'laura@flowboard.io', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Laura', role: 'QA Engineer' },
]

export const workspaces: Workspace[] = [
  { id: 'ws1', name: 'FlowBoard Inc', slug: 'flowboard' },
  { id: 'ws2', name: 'Acme Corp', slug: 'acme' },
]

export const projects: Project[] = [
  { id: 'p1', name: 'Web Platform', key: 'WEB', workspaceId: 'ws1', color: '#6366f1' },
  { id: 'p2', name: 'Mobile App', key: 'MOB', workspaceId: 'ws1', color: '#10b981' },
  { id: 'p3', name: 'API Services', key: 'API', workspaceId: 'ws1', color: '#f59e0b' },
]

export const sprints: Sprint[] = [
  { 
    id: 's1', 
    name: 'Sprint 14', 
    projectId: 'p1', 
    startDate: '2026-03-16', 
    endDate: '2026-03-30', 
    goal: 'Complete user dashboard redesign and improve performance',
    isActive: true 
  },
  { 
    id: 's2', 
    name: 'Sprint 13', 
    projectId: 'p1', 
    startDate: '2026-03-02', 
    endDate: '2026-03-15', 
    goal: 'API integration and authentication flow',
    isActive: false 
  },
]

export const tickets: Ticket[] = [
  {
    id: 't1',
    key: 'WEB-142',
    title: 'Implement dark mode toggle in settings',
    description: 'Add a toggle switch in the user settings page that allows users to switch between light and dark mode. The preference should persist across sessions.',
    status: 'in_progress',
    priority: 'high',
    type: 'story',
    assigneeId: 'u2',
    reporterId: 'u1',
    watcherIds: ['u1', 'u4'],
    labels: ['ui', 'settings'],
    sprintId: 's1',
    projectId: 'p1',
    storyPoints: 5,
    createdAt: '2026-03-16T10:00:00Z',
    updatedAt: '2026-03-19T14:30:00Z',
    subtasks: [
      { id: 'st1', title: 'Design toggle component', completed: true },
      { id: 'st2', title: 'Implement theme switching logic', completed: true },
      { id: 'st3', title: 'Add persistence to localStorage', completed: false },
      { id: 'st4', title: 'Write unit tests', completed: false },
    ]
  },
  {
    id: 't2',
    key: 'WEB-143',
    title: 'Fix navigation menu overlap on mobile',
    description: 'The navigation menu overlaps with the content area on screens smaller than 768px. This needs to be fixed for a better mobile experience.',
    status: 'in_review',
    priority: 'urgent',
    type: 'bug',
    assigneeId: 'u4',
    reporterId: 'u5',
    watcherIds: ['u1', 'u2'],
    labels: ['bug', 'mobile', 'urgent'],
    sprintId: 's1',
    projectId: 'p1',
    storyPoints: 3,
    createdAt: '2026-03-17T09:00:00Z',
    updatedAt: '2026-03-19T16:00:00Z',
    subtasks: []
  },
  {
    id: 't3',
    key: 'WEB-144',
    title: 'Create user onboarding flow',
    description: 'Design and implement a 3-step onboarding flow for new users that guides them through initial setup including profile creation, preferences, and team invitation.',
    status: 'todo',
    priority: 'high',
    type: 'story',
    assigneeId: 'u2',
    reporterId: 'u1',
    watcherIds: ['u4'],
    labels: ['feature', 'onboarding'],
    sprintId: 's1',
    projectId: 'p1',
    storyPoints: 8,
    createdAt: '2026-03-18T11:00:00Z',
    updatedAt: '2026-03-18T11:00:00Z',
    subtasks: [
      { id: 'st5', title: 'Design onboarding screens', completed: false },
      { id: 'st6', title: 'Implement step navigation', completed: false },
      { id: 'st7', title: 'Add progress indicator', completed: false },
    ]
  },
  {
    id: 't4',
    key: 'WEB-145',
    title: 'Optimize image loading performance',
    description: 'Implement lazy loading for images across the platform to improve initial page load times.',
    status: 'todo',
    priority: 'medium',
    type: 'task',
    assigneeId: 'u3',
    reporterId: 'u2',
    watcherIds: [],
    labels: ['performance'],
    sprintId: 's1',
    projectId: 'p1',
    storyPoints: 5,
    createdAt: '2026-03-18T14:00:00Z',
    updatedAt: '2026-03-18T14:00:00Z',
    subtasks: []
  },
  {
    id: 't5',
    key: 'WEB-146',
    title: 'Add export to CSV functionality',
    description: 'Allow users to export their data in CSV format from the reports section.',
    status: 'done',
    priority: 'low',
    type: 'task',
    assigneeId: 'u3',
    reporterId: 'u1',
    watcherIds: ['u1'],
    labels: ['feature', 'reports'],
    sprintId: 's1',
    projectId: 'p1',
    storyPoints: 3,
    createdAt: '2026-03-16T08:00:00Z',
    updatedAt: '2026-03-19T10:00:00Z',
    subtasks: []
  },
  {
    id: 't6',
    key: 'WEB-147',
    title: 'Implement real-time notifications',
    description: 'Add WebSocket-based real-time notifications for task updates, comments, and mentions.',
    status: 'backlog',
    priority: 'medium',
    type: 'story',
    assigneeId: null,
    reporterId: 'u1',
    watcherIds: [],
    labels: ['feature', 'real-time'],
    sprintId: null,
    projectId: 'p1',
    storyPoints: 13,
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-03-15T10:00:00Z',
    subtasks: []
  },
  {
    id: 't7',
    key: 'WEB-148',
    title: 'Redesign dashboard widgets',
    description: 'Update the dashboard widgets with a more modern look and add customization options.',
    status: 'backlog',
    priority: 'low',
    type: 'story',
    assigneeId: null,
    reporterId: 'u4',
    watcherIds: ['u1'],
    labels: ['ui', 'dashboard'],
    sprintId: null,
    projectId: 'p1',
    storyPoints: 8,
    createdAt: '2026-03-14T09:00:00Z',
    updatedAt: '2026-03-14T09:00:00Z',
    subtasks: []
  },
  {
    id: 't8',
    key: 'WEB-149',
    title: 'Add keyboard shortcuts documentation',
    description: 'Create a help modal showing all available keyboard shortcuts in the application.',
    status: 'backlog',
    priority: 'low',
    type: 'task',
    assigneeId: null,
    reporterId: 'u2',
    watcherIds: [],
    labels: ['documentation'],
    sprintId: null,
    projectId: 'p1',
    storyPoints: 2,
    createdAt: '2026-03-13T14:00:00Z',
    updatedAt: '2026-03-13T14:00:00Z',
    subtasks: []
  },
  {
    id: 't9',
    key: 'WEB-150',
    title: 'Implement two-factor authentication',
    description: 'Add 2FA support using TOTP for enhanced account security.',
    status: 'backlog',
    priority: 'high',
    type: 'story',
    assigneeId: null,
    reporterId: 'u1',
    watcherIds: ['u3'],
    labels: ['security', 'feature'],
    sprintId: null,
    projectId: 'p1',
    storyPoints: 8,
    createdAt: '2026-03-12T11:00:00Z',
    updatedAt: '2026-03-12T11:00:00Z',
    subtasks: []
  },
  {
    id: 't10',
    key: 'WEB-151',
    title: 'Fix date picker timezone issues',
    description: 'The date picker shows incorrect dates for users in different timezones.',
    status: 'in_progress',
    priority: 'medium',
    type: 'bug',
    assigneeId: 'u3',
    reporterId: 'u5',
    watcherIds: [],
    labels: ['bug'],
    sprintId: 's1',
    projectId: 'p1',
    storyPoints: 3,
    createdAt: '2026-03-17T15:00:00Z',
    updatedAt: '2026-03-19T09:00:00Z',
    subtasks: []
  },
]

export const comments: Comment[] = [
  { id: 'c1', ticketId: 't1', userId: 'u1', content: 'This is a high priority item. Please make sure we follow the design system guidelines.', createdAt: '2026-03-16T10:30:00Z' },
  { id: 'c2', ticketId: 't1', userId: 'u2', content: 'I have finished the toggle component design. Moving on to the implementation.', createdAt: '2026-03-17T14:00:00Z' },
  { id: 'c3', ticketId: 't1', userId: 'u4', content: 'The design looks good! I have reviewed and approved it.', createdAt: '2026-03-18T09:00:00Z' },
  { id: 'c4', ticketId: 't2', userId: 'u5', content: 'I found this issue during mobile testing. Screenshots attached in the description.', createdAt: '2026-03-17T09:15:00Z' },
  { id: 'c5', ticketId: 't2', userId: 'u4', content: 'Fixed! Please review when you have a chance.', createdAt: '2026-03-19T15:00:00Z' },
]

export const statusConfig: Record<TicketStatus, { label: string; color: string; bgColor: string }> = {
  backlog: { label: 'Backlog', color: 'text-muted-foreground', bgColor: 'bg-muted' },
  todo: { label: 'To Do', color: 'text-foreground', bgColor: 'bg-secondary' },
  in_progress: { label: 'In Progress', color: 'text-primary', bgColor: 'bg-primary/10' },
  in_review: { label: 'In Review', color: 'text-warning-foreground', bgColor: 'bg-warning/20' },
  done: { label: 'Done', color: 'text-success', bgColor: 'bg-success/10' },
}

export const priorityConfig: Record<TicketPriority, { label: string; color: string; icon: string }> = {
  low: { label: 'Low', color: 'text-muted-foreground', icon: '▽' },
  medium: { label: 'Medium', color: 'text-warning', icon: '◆' },
  high: { label: 'High', color: 'text-chart-3', icon: '▲' },
  urgent: { label: 'Urgent', color: 'text-destructive', icon: '⬆' },
}

export const typeConfig: Record<TicketType, { label: string; color: string; bgColor: string }> = {
  task: { label: 'Task', color: 'text-primary', bgColor: 'bg-primary/10' },
  bug: { label: 'Bug', color: 'text-destructive', bgColor: 'bg-destructive/10' },
  story: { label: 'Story', color: 'text-success', bgColor: 'bg-success/10' },
  epic: { label: 'Epic', color: 'text-chart-5', bgColor: 'bg-chart-5/10' },
  subtask: { label: 'Subtask', color: 'text-muted-foreground', bgColor: 'bg-muted' },
  support: { label: 'Soporte', color: 'text-sky-500', bgColor: 'bg-sky-500/10' },
}
