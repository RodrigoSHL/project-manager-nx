import type { ApiTeamMember } from '@/types/project'
import {
  getCommentMentionQuery,
  insertCommentMention,
  parseCommentMentions,
  serializeCommentMentions,
  updateCommentMentions,
} from './comment-mentions'

const member = {
  id: '0c7ca2b3-6cc4-418a-9d43-88184e26f693',
  name: 'Ariana Morales',
} as ApiTeamMember

describe('comment mentions', () => {
  it('stores a stable member id while displaying a readable name', () => {
    const inserted = insertCommentMention('Hola @ari, revisa esto', [], 5, 9, member)
    expect(inserted.text).toBe('Hola @Ariana Morales, revisa esto')
    const stored = serializeCommentMentions(inserted.text, inserted.mentions)
    expect(stored).toContain(`@{member:${member.id}:Ariana%20Morales}`)
    expect(parseCommentMentions(stored)).toEqual({ text: inserted.text, mentions: inserted.mentions })
  })

  it('keeps mention offsets after surrounding edits and removes an edited mention', () => {
    const inserted = insertCommentMention('Hola @ari', [], 5, 9, member)
    const before = updateCommentMentions(inserted.text, `Buen día, ${inserted.text}`, inserted.mentions)
    expect(before[0].start).toBe(inserted.mentions[0].start + 10)
    expect(updateCommentMentions(inserted.text, inserted.text.replace('Ariana', 'Ana'), inserted.mentions)).toEqual([])
  })

  it('preserves multiple member identities after editing unrelated text', () => {
    const first = insertCommentMention('@ari y @her', [], 0, 4, member)
    const secondMember = {
      id: 'de017587-4cb2-4f45-bdd9-7dbeaf54bc18',
      name: 'Hernán Álvarez',
    } as ApiTeamMember
    const secondStart = first.text.indexOf('@her')
    const second = insertCommentMention(first.text, first.mentions, secondStart, secondStart + 4, secondMember)
    const editedText = `${second.text} por favor`
    const ranges = updateCommentMentions(second.text, editedText, second.mentions)
    const parsed = parseCommentMentions(serializeCommentMentions(editedText, ranges))
    expect(parsed).toEqual({ text: editedText, mentions: ranges })
    expect(parsed.mentions.map(mention => mention.memberId)).toEqual([member.id, secondMember.id])
  })

  it('opens suggestions at an unfinished @mention', () => {
    expect(getCommentMentionQuery('Hola @ari', 9, [])).toEqual({ start: 5, query: 'ari' })
    expect(getCommentMentionQuery('Hola correo@ejemplo.cl', 22, [])).toBeNull()
  })
})
