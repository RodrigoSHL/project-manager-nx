import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class CommentAttachmentsService {
  // The project controller checks access before resolving these internal records.
  async assertTicketAttachments(projectId: string, ticketId: string, ids: string[] = []): Promise<void> {
    if (!ids?.length) return;
    const base = (process.env.FILES_API_URL || 'http://localhost:3004/api').replace(/\/$/, '');
    const query = new URLSearchParams({ application: 'jira-web', ownerType: 'ticket', ownerId: ticketId });
    let files: { id: string; application: string; ownerType: string; ownerId: string; metadata?: { category?: string; projectId?: string } }[];
    try {
      const response = await fetch(`${base}/files?${query}`, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Files API unavailable');
      files = await response.json();
      if (!Array.isArray(files)) throw new Error('Invalid Files API response');
    } catch {
      throw new ServiceUnavailableException('No se pudieron verificar los archivos del comentario.');
    }
    const allowed = new Set(files.filter(file =>
      file.application === 'jira-web' && file.ownerType === 'ticket' && file.ownerId === ticketId &&
      file.metadata?.category === 'ticket-attachment' && file.metadata.projectId === projectId
    ).map(file => file.id));
    if (ids.some(id => !allowed.has(id))) {
      throw new BadRequestException('Los archivos adjuntos deben pertenecer a este ticket.');
    }
  }
}
