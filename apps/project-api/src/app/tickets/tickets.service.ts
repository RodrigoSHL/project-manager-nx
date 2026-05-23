import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './entities/ticket.entity';
import { Project } from '../projects/entities/project.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
  ) {}

  private async generateKey(projectId: string): Promise<string> {
    const project = await this.projectsRepository.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    if (!project.key) throw new BadRequestException(`Project must have a key (e.g. "WEB") to create tickets`);

    const count = await this.ticketsRepository.count({ where: { projectId } });
    return `${project.key}-${count + 1}`;
  }

  async create(projectId: string, dto: CreateTicketDto): Promise<Ticket> {
    const key = await this.generateKey(projectId);
    const ticket = this.ticketsRepository.create({ ...dto, projectId, key });
    return this.ticketsRepository.save(ticket);
  }

  findByProject(projectId: string): Promise<Ticket[]> {
    return this.ticketsRepository.find({
      where: { projectId },
      relations: ['labels'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(projectId: string, id: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id, projectId },
      relations: ['labels', 'sprint'],
    });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return ticket;
  }

  async update(projectId: string, id: string, dto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findOne(projectId, id);
    Object.assign(ticket, dto);
    return this.ticketsRepository.save(ticket);
  }

  async remove(projectId: string, id: string): Promise<void> {
    const ticket = await this.findOne(projectId, id);
    await this.ticketsRepository.remove(ticket);
  }
}

