import { Controller, Get, Post, Body, Patch, Delete, Param } from '@nestjs/common';
import { SupportDetailsService } from './support-details.service';
import { CreateSupportDetailDto } from './dto/create-support-detail.dto';
import { UpdateSupportDetailDto } from './dto/update-support-detail.dto';

@Controller('projects/:projectId/tickets/:ticketId/support-detail')
export class SupportDetailsController {
  constructor(private readonly supportDetailsService: SupportDetailsService) {}

  @Post()
  create(
    @Param('ticketId') ticketId: string,
    @Body() dto: CreateSupportDetailDto,
  ) {
    return this.supportDetailsService.create(ticketId, dto);
  }

  @Get()
  findOne(@Param('ticketId') ticketId: string) {
    return this.supportDetailsService.findByTicket(ticketId);
  }

  @Patch()
  update(
    @Param('ticketId') ticketId: string,
    @Body() dto: UpdateSupportDetailDto,
  ) {
    return this.supportDetailsService.update(ticketId, dto);
  }

  @Delete()
  remove(@Param('ticketId') ticketId: string) {
    return this.supportDetailsService.remove(ticketId);
  }
}
