import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CommentsService } from './comments.service';
import { CommentMentionNotificationsService } from './comment-mention-notifications.service';

describe('CommentsService replies', () => {
  const transaction = jest.fn();
  const repository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    manager: { transaction },
  };
  const manager = { getRepository: () => repository };
  const notifications = { enqueue: jest.fn() };
  const service = new CommentsService(
    repository as unknown as Repository<Comment>,
    notifications as unknown as CommentMentionNotificationsService
  );

  beforeEach(() => {
    jest.resetAllMocks();
    repository.create.mockImplementation((value) => value);
    repository.save.mockImplementation((value) => Promise.resolve(value));
    notifications.enqueue.mockResolvedValue(undefined);
    transaction.mockImplementation((callback) => callback(manager));
  });

  it('validates the parent inside the same ticket before saving a reply', async () => {
    repository.findOne.mockResolvedValue({
      id: 'parent-1',
      ticketId: 'ticket-1',
    });
    const reply = await service.create('ticket-1', {
      body: 'Respuesta',
      authorId: 'user-2',
      parentCommentId: 'parent-1',
    });
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 'parent-1', ticketId: 'ticket-1' },
    });
    expect(reply).toMatchObject({
      parentCommentId: 'parent-1',
      authorId: 'user-2',
      ticketId: 'ticket-1',
    });
    expect(notifications.enqueue).toHaveBeenCalledWith(manager, reply);
  });

  it('rejects a missing parent or a parent from another ticket', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(
      service.create('ticket-1', {
        body: 'Respuesta',
        authorId: 'user-2',
        parentCommentId: 'foreign-parent',
      })
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('keeps ordinary comments without a parent', async () => {
    const comment = await service.create('ticket-1', {
      body: 'Comentario',
      authorId: 'user-1',
    });
    expect(comment.parentCommentId).toBeNull();
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  it('keeps reply editing and deletion restricted to their author', async () => {
    repository.findOne.mockResolvedValue({
      id: 'reply-1',
      authorId: 'user-2',
      parentCommentId: 'parent-1',
    });
    await expect(
      service.update('ticket-1', 'reply-1', { body: 'Editado' }, 'user-1')
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.remove('ticket-1', 'reply-1', 'user-1')
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.save).not.toHaveBeenCalled();
    expect(repository.remove).not.toHaveBeenCalled();
  });

  it('enqueues only after saving, with the previous body on an edit', async () => {
    repository.findOne.mockResolvedValue({
      id: 'comment-1',
      authorId: 'user-1',
      body: 'Antes',
    });
    const comment = await service.update(
      'ticket-1',
      'comment-1',
      { body: 'Después' },
      'user-1'
    );
    expect(notifications.enqueue).toHaveBeenCalledWith(
      manager,
      comment,
      'Antes'
    );
    expect(repository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ lock: { mode: 'pessimistic_write' } })
    );
  });

  it('propagates queue persistence failure so the transaction rolls back', async () => {
    notifications.enqueue.mockRejectedValue(new Error('queue unavailable'));
    await expect(
      service.create('ticket-1', { body: 'Comentario', authorId: 'user-1' })
    ).rejects.toThrow('queue unavailable');
    expect(transaction).toHaveBeenCalled();
  });
});
