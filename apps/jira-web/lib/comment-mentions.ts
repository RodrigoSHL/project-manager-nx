import type { ApiTeamMember } from '@/types/project'

export interface CommentMention {
  memberId: string
  start: number
  end: number
}

const MENTION_TOKEN = /@\{member:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):([^}]+)\}/gi

export function parseCommentMentions(body: string): { text: string; mentions: CommentMention[] } {
  let text = ''
  let cursor = 0
  const mentions: CommentMention[] = []

  for (const match of body.matchAll(MENTION_TOKEN)) {
    const index = match.index ?? 0
    text += body.slice(cursor, index)
    try {
      const name = decodeURIComponent(match[2])
      const start = text.length
      text += `@${name}`
      mentions.push({ memberId: match[1], start, end: text.length })
    } catch {
      text += match[0]
    }
    cursor = index + match[0].length
  }

  return { text: text + body.slice(cursor), mentions }
}

export function serializeCommentMentions(text: string, mentions: CommentMention[]): string {
  let body = ''
  let cursor = 0

  for (const mention of [...mentions].sort((a, b) => a.start - b.start)) {
    const label = text.slice(mention.start, mention.end)
    if (mention.start < cursor || !label.startsWith('@') || label.length < 2) continue
    body += text.slice(cursor, mention.start)
    body += `@{member:${mention.memberId}:${encodeURIComponent(label.slice(1))}}`
    cursor = mention.end
  }

  return body + text.slice(cursor)
}

export function updateCommentMentions(
  previousText: string,
  nextText: string,
  mentions: CommentMention[],
): CommentMention[] {
  let start = 0
  while (start < previousText.length && start < nextText.length && previousText[start] === nextText[start]) start++

  let suffix = 0
  while (
    suffix < previousText.length - start
    && suffix < nextText.length - start
    && previousText[previousText.length - 1 - suffix] === nextText[nextText.length - 1 - suffix]
  ) suffix++

  const previousEnd = previousText.length - suffix
  const shift = nextText.length - previousText.length
  return mentions.flatMap(mention => {
    if (mention.end <= start) return [mention]
    if (mention.start >= previousEnd) return [{ ...mention, start: mention.start + shift, end: mention.end + shift }]
    return []
  })
}

export function insertCommentMention(
  text: string,
  mentions: CommentMention[],
  start: number,
  end: number,
  member: ApiTeamMember,
): { text: string; mentions: CommentMention[]; caret: number } {
  const label = `@${member.name}`
  const separator = /[\s,.;:!?)]/.test(text[end] ?? '') ? '' : ' '
  const nextText = text.slice(0, start) + label + separator + text.slice(end)
  const nextMentions = updateCommentMentions(text, nextText, mentions)
  nextMentions.push({ memberId: member.id, start, end: start + label.length })
  return { text: nextText, mentions: nextMentions, caret: start + label.length + separator.length }
}

export function getCommentMentionQuery(
  text: string,
  caret: number,
  mentions: CommentMention[],
): { start: number; query: string } | null {
  if (mentions.some(mention => caret > mention.start && caret <= mention.end)) return null
  const prefix = text.slice(0, caret)
  const match = prefix.match(/(?:^|[\s([{])@([^\s@]*)$/u)
  return match ? { start: caret - match[1].length - 1, query: match[1] } : null
}
