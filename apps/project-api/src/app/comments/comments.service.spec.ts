import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CommentsService } from './comments.service';

describe('CommentsService replies', () => {
  const repository = { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), remove: jest.fn() };
  const service = new CommentsService(repository as unknown as Repository<Comment>);

  beforeEach(() => {
    jest.resetAllMocks();
    repository.create.mockImplementation(value => value);
    repository.save.mockImplementation(value => Promise.resolve(value));
  });

  it('validates the parent inside the same ticket before saving a reply', async () => {
    repository.findOne.mockResolvedValue({ id: 'parent-1', ticketId: 'ticket-1' });
    const reply = await service.create('ticket-1', { body: 'Respuesta', authorId: 'user-2', parentCommentId: 'parent-1' });
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 'parent-1', ticketId: 'ticket-1' } });
    expect(reply).toMatchObject({ parentCommentId: 'parent-1', authorId: 'user-2', ticketId: 'ticket-1' });
  });

  it('rejects a missing parent or a parent from another ticket', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.create('ticket-1', { body: 'Respuesta', authorId: 'user-2', parentCommentId: 'foreign-parent' }))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('keeps ordinary comments without a parent', async () => {
    const comment = await service.create('ticket-1', { body: 'Comentario', authorId: 'user-1' });
    expect(comment.parentCommentId).toBeNull();
    expect(repository.findOne).not.toHaveBeenCalled();
  });

  it('keeps reply editing and deletion restricted to their author', async () => {
    repository.findOne.mockResolvedValue({ id: 'reply-1', authorId: 'user-2', parentCommentId: 'parent-1' });
    await expect(service.update('ticket-1', 'reply-1', { body: 'Editado' }, 'user-1')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.remove('ticket-1', 'reply-1', 'user-1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.save).not.toHaveBeenCalled();
    expect(repository.remove).not.toHaveBeenCalled();
  });
});
