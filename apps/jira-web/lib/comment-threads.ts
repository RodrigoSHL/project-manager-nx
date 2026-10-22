import type { ApiComment } from '@/types/project'

export interface CommentThreadEntry {
  comment: ApiComment
  parent?: ApiComment
  depth: number
}

export function buildCommentThreads(comments: ApiComment[]): CommentThreadEntry[] {
  const byId = new Map(comments.map(comment => [comment.id, comment]))
  const children = new Map<string | null, ApiComment[]>()
  for (const comment of comments) {
    const parentId = comment.parentCommentId && byId.has(comment.parentCommentId) ? comment.parentCommentId : null
    const siblings = children.get(parentId) ?? []
    siblings.push(comment)
    children.set(parentId, siblings)
  }

  const entries: CommentThreadEntry[] = []
  const visited = new Set<string>()
  const visit = (comment: ApiComment, depth: number) => {
    if (visited.has(comment.id)) return
    visited.add(comment.id)
    entries.push({ comment, parent: byId.get(comment.parentCommentId ?? ''), depth })
    for (const child of children.get(comment.id) ?? []) visit(child, depth + 1)
  }
  for (const root of children.get(null) ?? []) visit(root, 0)
  // Keep comments visible even if legacy data contains an invalid parent chain.
  for (const comment of comments) if (!visited.has(comment.id)) visit(comment, 0)
  return entries
}
