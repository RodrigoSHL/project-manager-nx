import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
  ) {}

  async create(ticketId: string, dto: CreateCommentDto): Promise<Comment> {
    const comment = this.commentsRepository.create({ ...dto, ticketId });
    return this.commentsRepository.save(comment);
  }

  findByTicket(ticketId: string): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { ticketId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(ticketId: string, id: string): Promise<Comment> {
    const comment = await this.commentsRepository.findOne({ where: { id, ticketId } });
    if (!comment) throw new NotFoundException(`Comment ${id} not found`);
    return comment;
  }

  async update(ticketId: string, id: string, dto: UpdateCommentDto, requesterId: string): Promise<Comment> {
    const comment = await this.findOne(ticketId, id);
    if (comment.authorId !== requesterId) throw new ForbiddenException('Only the author can edit this comment');
    comment.body = dto.body;
    return this.commentsRepository.save(comment);
  }

  async remove(ticketId: string, id: string, requesterId: string): Promise<void> {
    const comment = await this.findOne(ticketId, id);
    if (comment.authorId !== requesterId) throw new ForbiddenException('Only the author can delete this comment');
    await this.commentsRepository.remove(comment);
  }
}
