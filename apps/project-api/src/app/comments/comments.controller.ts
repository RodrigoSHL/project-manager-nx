import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('projects/:projectId/tickets/:ticketId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(
    @Param('ticketId') ticketId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(ticketId, dto);
  }

  @Get()
  findAll(@Param('ticketId') ticketId: string) {
    return this.commentsService.findByTicket(ticketId);
  }

  @Get(':id')
  findOne(
    @Param('ticketId') ticketId: string,
    @Param('id') id: string,
  ) {
    return this.commentsService.findOne(ticketId, id);
  }

  @Patch(':id')
  update(
    @Param('ticketId') ticketId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @Query('requesterId') requesterId: string,
  ) {
    return this.commentsService.update(ticketId, id, dto, requesterId);
  }

  @Delete(':id')
  remove(
    @Param('ticketId') ticketId: string,
    @Param('id') id: string,
    @Query('requesterId') requesterId: string,
  ) {
    return this.commentsService.remove(ticketId, id, requesterId);
  }
}
