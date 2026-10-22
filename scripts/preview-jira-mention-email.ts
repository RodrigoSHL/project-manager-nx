import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderJiraCommentMention } from '../apps/mailer-api/src/app/mailer/templates/jira-comment-mention.template';

const sample = {
  to: ['recipient@example.com'],
  recipientName: 'Sebastián',
  authorName: 'Carolina Rojas',
  projectName: 'Project Manager NX',
  ticketKey: 'PM-142',
  ticketTitle: 'Integrar las notificaciones de comentarios',
  commentText:
    '@Sebastián, ya dejé lista la integración con Mailer API.\n¿Puedes revisar el flujo de menciones antes de cerrar el ticket?',
  workspaceId: '00000000-0000-4000-8000-000000000001',
  projectId: '00000000-0000-4000-8000-000000000002',
  ticketId: '00000000-0000-4000-8000-000000000003',
  commentId: '00000000-0000-4000-8000-000000000004',
};
const target = resolve('docs/email-previews');
mkdirSync(target, { recursive: true });
const rendered = renderJiraCommentMention(sample, 'https://jira.atomdev.cl');
writeFileSync(resolve(target, 'jira-comment-mention.html'), rendered.html);
writeFileSync(resolve(target, 'jira-comment-mention.txt'), rendered.text);
console.log(
  'Preview generado en docs/email-previews/jira-comment-mention.html'
);
