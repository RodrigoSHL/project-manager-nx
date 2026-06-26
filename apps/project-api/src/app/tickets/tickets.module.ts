import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { Ticket } from './entities/ticket.entity';
import { Project } from '../projects/entities/project.entity';
import { TicketSupportDetail } from '../support-details/entities/ticket-support-detail.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Project, TicketSupportDetail])],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
