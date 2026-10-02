import type { ApiComment } from '@/types/project'
import { buildCommentThreads } from './comment-threads'

const comment = (id: string, parentCommentId: string | null = null) => ({ id, parentCommentId } as ApiComment)

describe('comment threads', () => {
  it('groups replies and nested replies under their original comment', () => {
    const entries = buildCommentThreads([comment('a'), comment('b'), comment('c', 'a'), comment('d', 'c')]);
    expect(entries.map(({ comment, depth }) => [comment.id, depth])).toEqual([['a', 0], ['c', 1], ['d', 2], ['b', 0]]);
    expect(entries[2].parent?.id).toBe('c');
  });

  it('keeps replies visible when their parent was removed', () => {
    const entries = buildCommentThreads([comment('reply', 'missing'), comment('child', 'reply')]);
    expect(entries.map(({ comment, depth }) => [comment.id, depth])).toEqual([['reply', 0], ['child', 1]]);
    expect(entries[0].parent).toBeUndefined();
  });
});
