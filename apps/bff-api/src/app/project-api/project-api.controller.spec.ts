import { ForbiddenException } from '@nestjs/common';
import { ExpressRequestWithUser } from '../auth/types/express-request-with-user';
import { UserRole } from '../user-api/user-api.client';
import { ProjectAccessService } from './project-access.service';
import { ProjectApiClient } from './project-api.client';
import { ProjectApiController } from './project-api.controller';

describe('ProjectApiController workspace role permissions', () => {
  const request = {
    user: { userId: 'viewer-1', email: 'viewer@example.com', name: 'Viewer', roles: [UserRole.USER] },
  } as ExpressRequestWithUser;
  const projectId = 'project-1';
  const ticketId = 'ticket-1';
  let controller: ProjectApiController;
  let client: { forwardJsonRequest: jest.Mock; createTicketComment: jest.Mock; findTicket: jest.Mock };
  let access: { assertProjectAccess: jest.Mock; assertProjectWriteAccess: jest.Mock };

  beforeEach(() => {
    client = { forwardJsonRequest: jest.fn(), createTicketComment: jest.fn().mockResolvedValue({ id: 'comment-1' }), findTicket: jest.fn().mockResolvedValue({ id: ticketId }) };
    access = {
      assertProjectAccess: jest.fn().mockResolvedValue(undefined),
      assertProjectWriteAccess: jest.fn().mockRejectedValue(new ForbiddenException()),
    };
    controller = new ProjectApiController(
      client as unknown as ProjectApiClient,
      access as unknown as ProjectAccessService,
    );
  });

  it.each([
    ['create', () => controller.createTicket(projectId, { title: 'Story' }, request)],
    ['edit', () => controller.updateTicket(projectId, ticketId, { title: 'Changed' }, request)],
    ['delete', () => controller.removeTicket(projectId, ticketId, request)],
  ])('rejects a viewer trying to %s a ticket', async (_action, operation) => {
    await expect(operation()).rejects.toBeInstanceOf(ForbiddenException);
    expect(client.forwardJsonRequest).not.toHaveBeenCalled();
  });

  it('allows a viewer to comment on a ticket', async () => {
    await expect(controller.createTicketComment(projectId, ticketId, { body: '  Comentario  ' }, request))
      .resolves.toEqual({ id: 'comment-1' });
    expect(access.assertProjectAccess).toHaveBeenCalledWith(projectId, request.user);
    expect(client.createTicketComment).toHaveBeenCalledWith(projectId, ticketId, 'Comentario', request.user, undefined);
  });

  it('allows a viewer to reply while preserving the authenticated author', async () => {
    await controller.createTicketComment(projectId, ticketId, { body: 'Respuesta', parentCommentId: 'parent-1' }, request);
    expect(client.createTicketComment).toHaveBeenCalledWith(projectId, ticketId, 'Respuesta', request.user, 'parent-1');
  });

  it('rejects replies when the ticket does not belong to the accessible project', async () => {
    client.findTicket.mockRejectedValue(new ForbiddenException());
    await expect(controller.createTicketComment(projectId, ticketId, { body: 'Respuesta', parentCommentId: 'parent-1' }, request))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(client.createTicketComment).not.toHaveBeenCalled();
  });
});
