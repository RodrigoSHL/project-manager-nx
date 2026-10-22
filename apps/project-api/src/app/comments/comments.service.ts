import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentMentionNotificationsService } from './comment-mention-notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    private readonly notifications: CommentMentionNotificationsService
  ) {}

  async create(ticketId: string, dto: CreateCommentDto): Promise<Comment> {
    if (dto.parentCommentId) await this.findOne(ticketId, dto.parentCommentId);
    return this.commentsRepository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(Comment);
      const comment = await repository.save(
        repository.create({
          ...dto,
          ticketId,
          parentCommentId: dto.parentCommentId ?? null,
        })
      );
      await this.notifications.enqueue(manager, comment);
      return comment;
    });
  }

  findByTicket(ticketId: string): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { ticketId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(ticketId: string, id: string): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({
      where: { id, ticketId },
    });
    if (!comment) throw new NotFoundException(`Comment ${id} not found`);
    return comment;
  }

  async update(
    ticketId: string,
    id: string,
    dto: UpdateCommentDto,
    requesterId: string
  ): Promise<Comment> {
    const comment = await this.findOne(ticketId, id);
    if (comment.authorId !== requesterId)
      throw new ForbiddenException('Only the author can edit this comment');
    return this.commentsRepository.manager.transaction(async (manager) => {
      // Serialize edits so only one transaction enqueues a newly added mention.
      const current = await manager
        .getRepository(Comment)
        .findOne({
          where: { id, ticketId },
          lock: { mode: 'pessimistic_write' },
        });
      if (!current) throw new NotFoundException(`Comment ${id} not found`);
      const previousBody = current.body;
      current.body = dto.body;
      const saved = await manager.getRepository(Comment).save(current);
      await this.notifications.enqueue(manager, saved, previousBody);
      return saved;
    });
  }

  async remove(
    ticketId: string,
    id: string,
    requesterId: string
  ): Promise<void> {
    const comment = await this.findOne(ticketId, id);
    if (comment.authorId !== requesterId)
      throw new ForbiddenException('Only the author can delete this comment');
    await this.commentsRepository.remove(comment);
  }
}
