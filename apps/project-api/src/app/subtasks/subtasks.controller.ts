import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SubtasksService } from './subtasks.service';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { UpdateSubtaskDto } from './dto/update-subtask.dto';

@Controller('projects/:projectId/tickets/:ticketId/subtasks')
export class SubtasksController {
  constructor(private readonly subtasksService: SubtasksService) {}

  @Post()
  create(
    @Param('ticketId') ticketId: string,
    @Body() dto: CreateSubtaskDto,
  ) {
    return this.subtasksService.create(ticketId, dto);
  }

  @Get()
  findAll(@Param('ticketId') ticketId: string) {
    return this.subtasksService.findByTicket(ticketId);
  }

  @Get(':id')
  findOne(
    @Param('ticketId') ticketId: string,
    @Param('id') id: string,
  ) {
    return this.subtasksService.findOne(ticketId, id);
  }

  @Patch(':id')
  update(
    @Param('ticketId') ticketId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSubtaskDto,
  ) {
    return this.subtasksService.update(ticketId, id, dto);
  }

  @Delete(':id')
  remove(
    @Param('ticketId') ticketId: string,
    @Param('id') id: string,
  ) {
    return this.subtasksService.remove(ticketId, id);
  }
}
