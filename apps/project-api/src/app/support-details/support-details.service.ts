import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketSupportDetail } from './entities/ticket-support-detail.entity';
import { Ticket, TicketType } from '../tickets/entities/ticket.entity';
import { CreateSupportDetailDto } from './dto/create-support-detail.dto';
import { UpdateSupportDetailDto } from './dto/update-support-detail.dto';

@Injectable()
export class SupportDetailsService {
  constructor(
    @InjectRepository(TicketSupportDetail)
    private readonly repo: Repository<TicketSupportDetail>,
    @InjectRepository(Ticket)
    private readonly ticketsRepo: Repository<Ticket>,
  ) {}

  private async assertSupportTicket(ticketId: string): Promise<Ticket> {
    const ticket = await this.ticketsRepo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);
    if (ticket.type !== TicketType.SUPPORT) {
      throw new BadRequestException(`Ticket ${ticketId} is not of type 'support'`);
    }
    return ticket;
  }

  async create(ticketId: string, dto: CreateSupportDetailDto): Promise<TicketSupportDetail> {
    await this.assertSupportTicket(ticketId);
    const existing = await this.repo.findOne({ where: { ticketId } });
    if (existing) {
      throw new ConflictException(`Support detail already exists for ticket ${ticketId}`);
    }
    const detail = this.repo.create({ ...dto, ticketId });
    return this.repo.save(detail);
  }

  async findByTicket(ticketId: string): Promise<TicketSupportDetail> {
    const detail = await this.repo.findOne({ where: { ticketId } });
    if (!detail) throw new NotFoundException(`No support detail found for ticket ${ticketId}`);
    return detail;
  }

  async update(ticketId: string, dto: UpdateSupportDetailDto): Promise<TicketSupportDetail> {
    const detail = await this.findByTicket(ticketId);
    Object.assign(detail, dto);
    return this.repo.save(detail);
  }

  async remove(ticketId: string): Promise<void> {
    const detail = await this.findByTicket(ticketId);
    await this.repo.remove(detail);
  }

  /** Usado internamente por TicketsService al crear un ticket de tipo support */
  async createForTicket(ticketId: string): Promise<TicketSupportDetail> {
    const detail = this.repo.create({ ticketId, isBillable: true });
    return this.repo.save(detail);
  }
}
