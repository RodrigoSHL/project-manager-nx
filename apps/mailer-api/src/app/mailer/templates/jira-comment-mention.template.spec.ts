import { renderJiraCommentMention } from './jira-comment-mention.template';
import { JiraCommentMentionDto } from './jira-comment-mention.dto';

const id = '00000000-0000-4000-8000-000000000001';
const mention: JiraCommentMentionDto = {
  to: ['recipient@example.com'],
  recipientName: 'Sebastián',
  authorName: 'Carolina',
  projectName: 'Project Manager',
  ticketKey: 'PM-142',
  ticketTitle: 'Revisar notificaciones',
  commentText: 'Hola @Sebastián\n¿Puedes revisarlo?',
  workspaceId: id,
  projectId: id,
  ticketId: id,
  commentId: id,
};

describe('Jira mention template', () => {
  it('provides Spanish HTML and plain text with an authenticated deep link', () => {
    const result = renderJiraCommentMention(
      mention,
      'https://jira.atomdev.cl/?old=discard#old'
    );
    expect(result.subject).toBe(
      '[PM-142] Carolina te mencionó en un comentario'
    );
    expect(result.html).toContain('FlowBoard');
    expect(result.html).toContain('Hola @Sebastián<br>¿Puedes revisarlo?');
    const link = new URL(
      result.text.split('Ver comentario: ')[1].split('\n')[0]
    );
    expect(Object.fromEntries(link.searchParams)).toEqual({
      workspaceId: id,
      projectId: id,
      ticketId: id,
      commentId: id,
    });
    expect(link.hash).toBe('');
  });

  it('escapes every user-supplied HTML field and keeps plain text readable', () => {
    const value = '<img src=x onerror="alert(1)"> & \'quoted\'';
    const result = renderJiraCommentMention(
      {
        ...mention,
        recipientName: value,
        authorName: value,
        projectName: value,
        ticketTitle: value,
        commentText: value,
      },
      'https://jira.atomdev.cl'
    );
    expect(result.html).not.toContain('<img');
    expect(result.html).toContain(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;quoted&#39;'
    );
    expect(result.text).toContain(value);
  });

  it.each([
    'javascript:alert(1)',
    'http://external.example',
    'https://user:password@example.com',
    'not-a-url',
  ])('rejects an unsafe or invalid configured app URL (%s)', (url) => {
    expect(() => renderJiraCommentMention(mention, url)).toThrow();
  });

  it('allows localhost for development', () => {
    expect(
      renderJiraCommentMention(mention, 'http://localhost:4201').text
    ).toContain('http://localhost:4201/');
  });
});
