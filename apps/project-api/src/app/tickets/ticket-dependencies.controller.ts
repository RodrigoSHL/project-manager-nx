import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { TicketDependenciesService } from './ticket-dependencies.service';

class AddTicketDependencyDto {
  @IsUUID()
  prerequisiteId: string;
}

@Controller('projects/:projectId/tickets/:ticketId/dependencies')
export class TicketDependenciesController {
  constructor(private readonly dependencies: TicketDependenciesService) {}

  @Get()
  list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('ticketId', ParseUUIDPipe) ticketId: string
  ) {
    return this.dependencies.list(projectId, ticketId.toLowerCase());
  }

  @Post()
  add(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @Body() dto: AddTicketDependencyDto
  ) {
    return this.dependencies.add(
      projectId,
      ticketId.toLowerCase(),
      dto.prerequisiteId.toLowerCase()
    );
  }

  @Delete(':prerequisiteId')
  @HttpCode(204)
  remove(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @Param('prerequisiteId', ParseUUIDPipe) prerequisiteId: string
  ) {
    return this.dependencies.remove(projectId, ticketId, prerequisiteId);
  }
}
