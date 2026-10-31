import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { validate } from 'class-validator';
import { CommentAttachmentsService } from './comment-attachments.service';
import { CreateCommentBodyDto } from './dto/comment-body.dto';

describe('comment attachment boundaries', () => {
  const originalFetch = global.fetch;
  const service = new CommentAttachmentsService();
  const file = { id: 'file-1', application: 'jira-web', ownerType: 'ticket', ownerId: 'ticket-1', metadata: { category: 'ticket-attachment', projectId: 'project-1' } };
  let fetchMock: jest.Mock;
  beforeEach(() => { fetchMock = jest.fn(); global.fetch = fetchMock; });
  afterAll(() => { global.fetch = originalFetch; });

  it('allows existing files on the same project and ticket', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify([file])));
    await expect(service.assertTicketAttachments('project-1', 'ticket-1', ['file-1'])).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/files?application=jira-web&ownerType=ticket&ownerId=ticket-1'), expect.any(Object));
  });

  it.each([
    { ...file, application: 'other' },
    { ...file, ownerId: 'foreign-ticket' },
    { ...file, ownerType: 'traveler' },
    { ...file, metadata: { ...file.metadata, projectId: 'foreign-project' } },
    { ...file, metadata: { ...file.metadata, category: 'other' } },
    { ...file, id: 'another-file' },
  ])('rejects records that are missing or outside the ticket', async record => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify([record])));
    await expect(service.assertTicketAttachments('project-1', 'ticket-1', ['file-1'])).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not depend on storage for a plain-text comment', async () => {
    await service.assertTicketAttachments('project-1', 'ticket-1');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails closed when storage is unavailable', async () => {
    fetchMock.mockRejectedValue(new Error('network failure'));
    await expect(service.assertTicketAttachments('project-1', 'ticket-1', ['file-1'])).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it.each([['not-a-uuid'], Array(11).fill('90000000-0000-4000-8000-000000000001'), Array(2).fill('90000000-0000-4000-8000-000000000001')])(
    'rejects malformed, excessive and duplicate file references', async (...ids) => {
      const dto = Object.assign(new CreateCommentBodyDto(), { body: '', attachmentIds: ids });
      expect((await validate(dto)).some(error => error.property === 'attachmentIds')).toBe(true);
    }
  );
});
