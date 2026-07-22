import { ForbiddenException, UnsupportedMediaTypeException } from '@nestjs/common';
import { ProjectApiClient } from '../project-api/project-api.client';
import { TravelApiClient } from '../travel-api/travel-api.client';
import { UserRole } from '../user-api/user-api.client';
import { FilesApiService, IncomingFile } from './files-api.service';

const projectId = '8b087a16-a4b1-494d-9123-e228073c289e';
const ticketId = '5b436236-af60-489e-aa8a-7893041fbe54';
const user = {
  userId: '18c95b40-922d-4cb9-94f9-e027090787a4',
  email: 'admin@example.com',
  name: 'Admin',
  roles: [UserRole.ADMIN],
};
const file: IncomingFile = {
  buffer: Buffer.from('pdf'),
  mimetype: 'application/pdf',
  originalname: 'evidencia.pdf',
  size: 3,
};

describe('FilesApiService Jira attachments', () => {
  let service: FilesApiService;
  let projectApi: { findTicket: jest.Mock };
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    projectApi = { findTicket: jest.fn().mockResolvedValue({ id: ticketId, projectId }) };
    service = new FilesApiService(
      {} as TravelApiClient,
      projectApi as unknown as ProjectApiClient,
    );
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  it('validates the ticket and sends normalized metadata to files-api', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: 'file-1' }), { status: 201 }));

    await service.upload(file, {
      application: 'jira-web',
      ownerType: 'ticket',
      ownerId: ticketId,
      metadata: JSON.stringify({ projectId, ticketKey: 'WEB-1', uploadedBy: 'spoofed' }),
    }, user);

    expect(projectApi.findTicket).toHaveBeenCalledWith(projectId, ticketId);
    const [, init] = fetchMock.mock.calls[0];
    const form = init?.body as FormData;
    expect(form.get('application')).toBe('jira-web');
    expect(form.get('ownerType')).toBe('ticket');
    expect(form.get('ownerId')).toBe(ticketId);
    expect(JSON.parse(String(form.get('metadata')))).toEqual({
      category: 'ticket-attachment',
      projectId,
      ticketKey: 'WEB-1',
      uploadedBy: user.userId,
    });
  });

  it('rejects Jira attachments from non-admin users', async () => {
    await expect(service.upload(file, {
      application: 'jira-web',
      ownerType: 'ticket',
      ownerId: ticketId,
      metadata: JSON.stringify({ projectId }),
    }, { ...user, roles: [UserRole.USER] })).rejects.toBeInstanceOf(ForbiddenException);

    expect(projectApi.findTicket).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects executable content before contacting upstream services', async () => {
    await expect(service.upload({ ...file, mimetype: 'application/x-msdownload' }, {
      application: 'jira-web',
      ownerType: 'ticket',
      ownerId: ticketId,
      metadata: JSON.stringify({ projectId }),
    }, user)).rejects.toBeInstanceOf(UnsupportedMediaTypeException);

    expect(projectApi.findTicket).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not store a file when its ticket cannot be found', async () => {
    projectApi.findTicket.mockRejectedValueOnce(new Error('Ticket not found'));

    await expect(service.upload(file, {
      application: 'jira-web',
      ownerType: 'ticket',
      ownerId: ticketId,
      metadata: JSON.stringify({ projectId }),
    }, user)).rejects.toThrow('Ticket not found');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('lists only ticket attachments belonging to the requested project', async () => {
    const base = {
      id: 'file-1',
      application: 'jira-web',
      ownerType: 'ticket',
      ownerId: ticketId,
      originalName: 'evidencia.pdf',
      mimeType: 'application/pdf',
      size: 3,
    };
    fetchMock.mockResolvedValue(new Response(JSON.stringify([
      { ...base, metadata: { category: 'ticket-attachment', projectId } },
      { ...base, id: 'file-2', metadata: { category: 'ticket-attachment', projectId: 'another-project' } },
      { ...base, id: 'file-3', metadata: { category: 'other', projectId } },
    ]), { status: 200 }));

    await expect(service.list({
      application: 'jira-web',
      ownerType: 'ticket',
      ownerId: ticketId,
      projectId,
    }, user)).resolves.toEqual([
      { ...base, metadata: { category: 'ticket-attachment', projectId } },
    ]);
    expect(projectApi.findTicket).toHaveBeenCalledWith(projectId, ticketId);
  });
});
