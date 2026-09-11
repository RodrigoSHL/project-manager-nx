import {
  ForbiddenException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ProjectAccessService } from '../project-api/project-access.service';
import { ProjectApiClient } from '../project-api/project-api.client';
import { TravelApiClient } from '../travel-api/travel-api.client';
import { UserRole } from '../user-api/user-api.client';
import { InspectionApiClient } from '../inspection-api/inspection-api.client';
import { FilesApiService, IncomingFile } from './files-api.service';

const projectId = '8b087a16-a4b1-494d-9123-e228073c289e';
const ticketId = '5b436236-af60-489e-aa8a-7893041fbe54';
const tenantId = '4b68dd5e-c725-411a-9328-1e667bfe47aa';
const workId = 'b27e7805-eed6-4537-8cce-99ef03ca36a2';
const formItemId = '65eb1753-c760-4cf8-891e-25f5389afc12';
const user = {
  userId: '18c95b40-922d-4cb9-94f9-e027090787a4',
  email: 'member@example.com',
  name: 'Project member',
  roles: [UserRole.USER],
};
const file: IncomingFile = {
  buffer: Buffer.from('pdf'),
  mimetype: 'application/pdf',
  originalname: 'evidencia.pdf',
  size: 3,
};
const storedFile = {
  id: '86c33190-a73a-4ab8-bccc-df8d25c65a4e',
  application: 'jira-web',
  ownerType: 'ticket',
  ownerId: ticketId,
  originalName: 'evidencia.pdf',
  mimeType: 'application/pdf',
  size: 3,
  metadata: { category: 'ticket-attachment', projectId },
};

describe('FilesApiService Jira attachments', () => {
  let service: FilesApiService;
  let projectApi: { findTicket: jest.Mock };
  let projectAccess: { assertProjectAccess: jest.Mock };
  let inspectionApi: { hasTenantAccess: jest.Mock; getWork: jest.Mock };
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    projectApi = {
      findTicket: jest.fn().mockResolvedValue({ id: ticketId, projectId }),
    };
    projectAccess = {
      assertProjectAccess: jest.fn().mockResolvedValue(undefined),
    };
    inspectionApi = {
      hasTenantAccess: jest.fn().mockResolvedValue({ hasAccess: true }),
      getWork: jest.fn().mockResolvedValue({
        work: { status: 'IN_PROGRESS' },
        snapshot: { sections: [{ items: [{ id: formItemId }] }] },
      }),
    };
    service = new FilesApiService(
      {} as TravelApiClient,
      projectApi as unknown as ProjectApiClient,
      projectAccess as unknown as ProjectAccessService,
      inspectionApi as unknown as InspectionApiClient
    );
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  it('validates the ticket and sends normalized metadata to files-api', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'file-1' }), { status: 201 })
    );

    await service.upload(
      file,
      {
        application: 'jira-web',
        ownerType: 'ticket',
        ownerId: ticketId,
        metadata: JSON.stringify({
          projectId,
          ticketKey: 'WEB-1',
          uploadedBy: 'spoofed',
        }),
      },
      user
    );

    expect(projectAccess.assertProjectAccess).toHaveBeenCalledWith(
      projectId,
      user
    );
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

  it('allows a project member to upload Jira attachments', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'file-1' }), { status: 201 })
    );

    await expect(
      service.upload(
        file,
        {
          application: 'jira-web',
          ownerType: 'ticket',
          ownerId: ticketId,
          metadata: JSON.stringify({ projectId }),
        },
        user
      )
    ).resolves.toEqual({ id: 'file-1' });

    expect(projectAccess.assertProjectAccess).toHaveBeenCalledWith(
      projectId,
      user
    );
    expect(projectApi.findTicket).toHaveBeenCalledWith(projectId, ticketId);
  });

  it('rejects Jira attachments when project membership is denied', async () => {
    projectAccess.assertProjectAccess.mockRejectedValueOnce(
      new ForbiddenException('Project access denied')
    );

    await expect(
      service.upload(
        file,
        {
          application: 'jira-web',
          ownerType: 'ticket',
          ownerId: ticketId,
          metadata: JSON.stringify({ projectId }),
        },
        user
      )
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(projectApi.findTicket).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects executable content before contacting upstream services', async () => {
    await expect(
      service.upload(
        { ...file, mimetype: 'application/x-msdownload' },
        {
          application: 'jira-web',
          ownerType: 'ticket',
          ownerId: ticketId,
          metadata: JSON.stringify({ projectId }),
        },
        user
      )
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);

    expect(projectApi.findTicket).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not store a file when its ticket cannot be found', async () => {
    projectApi.findTicket.mockRejectedValueOnce(new Error('Ticket not found'));

    await expect(
      service.upload(
        file,
        {
          application: 'jira-web',
          ownerType: 'ticket',
          ownerId: ticketId,
          metadata: JSON.stringify({ projectId }),
        },
        user
      )
    ).rejects.toThrow('Ticket not found');

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
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify([
          { ...base, metadata: { category: 'ticket-attachment', projectId } },
          {
            ...base,
            id: 'file-2',
            metadata: {
              category: 'ticket-attachment',
              projectId: 'another-project',
            },
          },
          { ...base, id: 'file-3', metadata: { category: 'other', projectId } },
        ]),
        { status: 200 }
      )
    );

    await expect(
      service.list(
        {
          application: 'jira-web',
          ownerType: 'ticket',
          ownerId: ticketId,
          projectId,
        },
        user
      )
    ).resolves.toEqual([
      { ...base, metadata: { category: 'ticket-attachment', projectId } },
    ]);
    expect(projectAccess.assertProjectAccess).toHaveBeenCalledWith(
      projectId,
      user
    );
    expect(projectApi.findTicket).toHaveBeenCalledWith(projectId, ticketId);
  });

  it('authorizes a project member before returning a Jira attachment', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(storedFile), { status: 200 })
    );

    await expect(service.get(storedFile.id, user)).resolves.toEqual(storedFile);

    expect(projectAccess.assertProjectAccess).toHaveBeenCalledWith(
      projectId,
      user
    );
    expect(projectApi.findTicket).toHaveBeenCalledWith(projectId, ticketId);
  });

  it('allows a project member to download Jira attachment content', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify(storedFile), { status: 200 })
      )
      .mockResolvedValueOnce(new Response('pdf-content', { status: 200 }));

    const response = await service.content(storedFile.id, user);

    await expect(response.text()).resolves.toBe('pdf-content');
    expect(projectAccess.assertProjectAccess).toHaveBeenCalledWith(
      projectId,
      user
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('allows a project member to delete a Jira attachment', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify(storedFile), { status: 200 })
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await expect(service.remove(storedFile.id, user)).resolves.toBeUndefined();

    expect(projectAccess.assertProjectAccess).toHaveBeenCalledWith(
      projectId,
      user
    );
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'DELETE' });
  });

  it('authorizes and normalizes a GridAssets work item photo', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'file-1' }), { status: 201 })
    );
    const photo = {
      ...file,
      mimetype: 'image/jpeg',
      originalname: 'gabinete.jpg',
    };

    await service.upload(
      photo,
      {
        application: 'inspection-web',
        ownerType: 'work',
        ownerId: workId,
        metadata: JSON.stringify({
          category: 'work-item-photo',
          tenantId,
          formItemId,
          uploadedBy: 'spoofed',
        }),
      },
      user
    );

    expect(inspectionApi.hasTenantAccess).toHaveBeenCalledWith(
      user.userId,
      tenantId
    );
    expect(inspectionApi.getWork).toHaveBeenCalledWith(tenantId, workId);
    const form = fetchMock.mock.calls[0][1]?.body as FormData;
    expect(form.get('application')).toBe('inspection-web');
    expect(JSON.parse(String(form.get('metadata')))).toEqual({
      category: 'work-item-photo',
      tenantId,
      formItemId,
      uploadedBy: user.userId,
    });
  });

  it('rejects a work photo when the user has no tenant membership', async () => {
    inspectionApi.hasTenantAccess.mockResolvedValueOnce({ hasAccess: false });

    await expect(
      service.upload(
        { ...file, mimetype: 'image/png', originalname: 'equipo.png' },
        {
          application: 'inspection-web',
          ownerType: 'work',
          ownerId: workId,
          metadata: JSON.stringify({
            category: 'work-item-photo',
            tenantId,
            formItemId,
          }),
        },
        user
      )
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(inspectionApi.getWork).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects new photos when the work is already closed', async () => {
    inspectionApi.getWork.mockResolvedValueOnce({
      work: { status: 'FINISHED' },
      snapshot: { sections: [{ items: [{ id: formItemId }] }] },
    });

    await expect(
      service.upload(
        { ...file, mimetype: 'image/jpeg', originalname: 'equipo.jpg' },
        {
          application: 'inspection-web',
          ownerType: 'work',
          ownerId: workId,
          metadata: JSON.stringify({
            category: 'work-item-photo',
            tenantId,
            formItemId,
          }),
        },
        user
      )
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
