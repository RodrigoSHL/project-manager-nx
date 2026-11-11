import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { Ticket } from './entities/ticket.entity';
import { Project } from '../projects/entities/project.entity';
import { TicketSupportDetail } from '../support-details/entities/ticket-support-detail.entity';
import { TeamMember } from '../projects/entities/team-member.entity';
import { Sprint } from '../sprints/entities/sprint.entity';
import { TicketDependenciesController } from './ticket-dependencies.controller';
import { TicketDependenciesService } from './ticket-dependencies.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Project, TicketSupportDetail, TeamMember, Sprint])],
  controllers: [TicketsController, TicketDependenciesController],
  providers: [TicketsService, TicketDependenciesService],
  exports: [TicketsService],
})
export class TicketsModule {}
