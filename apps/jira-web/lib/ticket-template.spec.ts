import {
  createTicketTemplate,
  parseTicketTemplate,
  serializeTicketTemplate,
} from './ticket-template'

describe('ticket template', () => {
  it('serializes the portable minimum ticket structure', () => {
    const template = createTicketTemplate({
      title: '  Corregir login  ',
      description: '  La sesión expira.  ',
      type: 'bug',
      priority: 'high',
      status: 'todo',
      storyPoints: '3',
      dueDate: '2026-07-31',
    })

    expect(JSON.parse(serializeTicketTemplate(template))).toEqual({
      title: 'Corregir login',
      description: 'La sesión expira.',
      type: 'bug',
      priority: 'high',
      status: 'todo',
      storyPoints: 3,
      dueDate: '2026-07-31',
    })
  })

  it('parses a valid shared JSON structure', () => {
    expect(parseTicketTemplate(JSON.stringify({
      title: 'Nuevo ticket',
      description: '',
      type: 'task',
      priority: 'medium',
      status: 'todo',
      storyPoints: null,
      dueDate: null,
    }))).toMatchObject({ title: 'Nuevo ticket', type: 'task' })
  })

  it('rejects invalid enum values', () => {
    expect(() => parseTicketTemplate(JSON.stringify({
      title: 'Ticket',
      description: '',
      type: 'invalid',
      priority: 'medium',
      status: 'todo',
      storyPoints: null,
      dueDate: null,
    }))).toThrow('type')
  })
})
