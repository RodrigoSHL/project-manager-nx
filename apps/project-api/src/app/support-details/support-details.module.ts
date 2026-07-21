import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportDetailsService } from './support-details.service';
import { SupportDetailsController } from './support-details.controller';
import { TicketSupportDetail } from './entities/ticket-support-detail.entity';
import { Ticket } from '../tickets/entities/ticket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TicketSupportDetail, Ticket])],
  controllers: [SupportDetailsController],
  providers: [SupportDetailsService],
  exports: [SupportDetailsService],
})
export class SupportDetailsModule {}
