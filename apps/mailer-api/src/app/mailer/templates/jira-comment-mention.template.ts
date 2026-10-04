import type { JiraCommentMentionDto } from './jira-comment-mention.dto';

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[
        character
      ] as string)
  );
}

export function parseJiraWebUrl(webUrl: string): URL {
  const url = new URL(webUrl);
  if (
    (url.protocol !== 'https:' &&
      !(
        url.protocol === 'http:' &&
        ['localhost', '127.0.0.1'].includes(url.hostname)
      )) ||
    url.username ||
    url.password
  ) {
    throw new Error('JIRA_WEB_URL must use HTTPS, or HTTP on localhost');
  }
  return url;
}

export function renderJiraCommentMention(
  data: JiraCommentMentionDto,
  webUrl: string
) {
  const url = parseJiraWebUrl(webUrl);
  url.search = new URLSearchParams({
    workspaceId: data.workspaceId,
    projectId: data.projectId,
    ticketId: data.ticketId,
    commentId: data.commentId,
  }).toString();
  url.hash = '';
  const ticketUrl = url.toString();
  const author = data.authorName.replace(/[\r\n]/g, ' ');
  const subject = `[${data.ticketKey}] ${author} te mencionó en un comentario`;
  const e = escapeHtml;
  const text = `FlowBoard · Notificaciones\n\nHola, ${data.recipientName}.\n${author} te mencionó en un comentario.\n\n${data.projectName} · ${data.ticketKey}\n${data.ticketTitle}\n\n${data.commentText}\n\nVer comentario: ${ticketUrl}\n\nRecibiste este correo porque te mencionaron en este ticket. Este mensaje es automático; responde desde FlowBoard.`;
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${e(
    subject
  )}</title>
<style>@media only screen and (max-width:620px){.outer{padding:24px 12px!important}.content{padding:28px 24px!important}.title{font-size:26px!important}.button{display:block!important;text-align:center!important}}</style></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,Helvetica,sans-serif;color:#0f172a">
<div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${e(
    author
  )} te mencionó en ${e(data.ticketKey)}: ${e(data.ticketTitle)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc"><tr><td class="outer" align="center" style="padding:48px 20px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px">
<tr><td style="padding:0 0 24px"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="36" height="36" align="center" style="background:#1575d5;border-radius:10px;color:#fff;font-size:21px;font-weight:700">F</td><td style="padding-left:11px;font-size:19px;font-weight:700;color:#0f172a">FlowBoard</td><td style="padding-left:12px;font-size:12px;color:#64748b">Tu equipo, en movimiento.</td></tr></table></td></tr>
<tr><td style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td height="4" style="background:#1575d5;border-radius:16px 16px 0 0;font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td class="content" style="padding:36px 40px">
<span style="display:inline-block;background:#eff6ff;border:1px solid #dbeafe;border-radius:20px;padding:6px 12px;color:#1575d5;font-size:11px;font-weight:700;letter-spacing:1px">NUEVA MENCIÓN</span>
<h1 class="title" style="margin:22px 0 12px;font-size:30px;line-height:1.22;letter-spacing:-0.8px;font-weight:700">Tu equipo te necesita<br>en la conversación.</h1>
<p style="margin:0 0 26px;font-size:15px;line-height:1.7;color:#475569">Hola, ${e(
    data.recipientName
  )}.<br><strong style="color:#0f172a">${e(
    author
  )}</strong> te mencionó en un comentario.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px"><tr><td style="padding:18px 20px">
<p style="margin:0 0 9px;font-size:12px;line-height:1.5;color:#64748b">${e(
    data.projectName
  )} <span style="color:#cbd5e1">&nbsp;/&nbsp;</span> <strong style="color:#1575d5">${e(
    data.ticketKey
  )}</strong></p>
<p style="margin:0;font-size:17px;line-height:1.45;font-weight:600;color:#0f172a">${e(
    data.ticketTitle
  )}</p>
</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;background:#f8fafc;border-radius:12px"><tr><td style="padding:20px;border-left:3px solid #1575d5;border-radius:0 12px 12px 0">
<p style="margin:0 0 10px;font-size:12px;color:#64748b;font-weight:600">${e(
    author
  )} comentó</p>
<p style="margin:0;font-size:14px;line-height:1.75;color:#334155;word-break:break-word">${e(
    data.commentText
  ).replace(/\r\n|\r|\n/g, '<br>')}</p>
</td></tr></table>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:28px"><tr><td><a class="button" href="${e(
    ticketUrl
  )}" style="display:inline-block;background:#1575d5;border:1px solid #1575d5;border-radius:9px;padding:14px 22px;color:#fff;font-size:14px;font-weight:600;text-decoration:none;mso-padding-alt:14px 22px">Ver comentario &rarr;</a></td></tr></table>
<p style="margin:18px 0 0;font-size:12px;line-height:1.7;color:#64748b">Continúa la conversación y revisa el contexto completo en FlowBoard.</p>
</td></tr></table></td></tr>
<tr><td style="padding:24px 16px 0;text-align:center"><p style="margin:0 0 8px;font-size:12px;line-height:1.7;color:#64748b">Recibiste este correo porque te mencionaron en este ticket.<br>Este mensaje es automático; responde desde FlowBoard.</p><p style="margin:0;font-size:11px;color:#94a3b8">FlowBoard &middot; AtomDev</p></td></tr>
</table></td></tr></table></body></html>`;
  return { subject, html, text };
}
