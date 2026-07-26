import type { ApiTicket } from '@/types/project'

export interface TicketTemplate {
  title: string
  description: string
  type: ApiTicket['type']
  priority: ApiTicket['priority']
  status: Exclude<ApiTicket['status'], 'cancelled'>
  storyPoints: number | null
  dueDate: string | null
}

const TICKET_TYPES: ReadonlySet<TicketTemplate['type']> = new Set([
  'story',
  'bug',
  'task',
  'epic',
  'subtask',
  'support',
])

const TICKET_PRIORITIES: ReadonlySet<TicketTemplate['priority']> = new Set([
  'lowest',
  'low',
  'medium',
  'high',
  'urgent',
])

const TICKET_STATUSES: ReadonlySet<TicketTemplate['status']> = new Set([
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'done',
])

export function createTicketTemplate(values: {
  title: string
  description: string
  type: TicketTemplate['type']
  priority: TicketTemplate['priority']
  status: TicketTemplate['status']
  storyPoints: string
  dueDate: string
}): TicketTemplate {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    type: values.type,
    priority: values.priority,
    status: values.status,
    storyPoints: values.storyPoints ? Number.parseInt(values.storyPoints, 10) : null,
    dueDate: values.dueDate || null,
  }
}

export function serializeTicketTemplate(template: TicketTemplate): string {
  return JSON.stringify(template, null, 2)
}

export function parseTicketTemplate(raw: string): TicketTemplate {
  let value: unknown

  try {
    value = JSON.parse(raw)
  } catch {
    throw new Error('El contenido del portapapeles no es un JSON válido.')
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('El JSON debe ser un objeto con la estructura de un ticket.')
  }

  const data = value as Record<string, unknown>
  const title = data.title
  const description = data.description
  const type = data.type
  const priority = data.priority
  const status = data.status
  const storyPoints = data.storyPoints
  const dueDate = data.dueDate

  if (typeof title !== 'string') throw new Error('El campo "title" debe ser texto.')
  if (typeof description !== 'string') throw new Error('El campo "description" debe ser texto.')
  if (typeof type !== 'string' || !TICKET_TYPES.has(type as TicketTemplate['type'])) {
    throw new Error('El campo "type" no contiene un tipo de ticket válido.')
  }
  if (typeof priority !== 'string' || !TICKET_PRIORITIES.has(priority as TicketTemplate['priority'])) {
    throw new Error('El campo "priority" no contiene una prioridad válida.')
  }
  if (typeof status !== 'string' || !TICKET_STATUSES.has(status as TicketTemplate['status'])) {
    throw new Error('El campo "status" no contiene un estado válido.')
  }
  if (storyPoints !== null && (typeof storyPoints !== 'number' || !Number.isInteger(storyPoints) || storyPoints < 0)) {
    throw new Error('El campo "storyPoints" debe ser un entero positivo o null.')
  }
  if (dueDate !== null && typeof dueDate !== 'string') {
    throw new Error('El campo "dueDate" debe ser una fecha YYYY-MM-DD o null.')
  }

  return {
    title: title.trim(),
    description: description.trim(),
    type: type as TicketTemplate['type'],
    priority: priority as TicketTemplate['priority'],
    status: status as TicketTemplate['status'],
    storyPoints,
    dueDate,
  }
}
