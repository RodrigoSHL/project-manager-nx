import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketType } from './entities/ticket.entity';
import { Project } from '../projects/entities/project.entity';
import { TicketSupportDetail } from '../support-details/entities/ticket-support-detail.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TeamMember } from '../projects/entities/team-member.entity';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,
    @InjectRepository(Project)
    private readonly projectsRepository: Repository<Project>,
    @InjectRepository(TicketSupportDetail)
    private readonly supportDetailsRepository: Repository<TicketSupportDetail>,
    @InjectRepository(TeamMember)
    private readonly teamMembersRepository: Repository<TeamMember>,
  ) {}

  private async assertProjectMemberAssignee(
    projectId: string,
    assigneeId?: string | null,
  ): Promise<void> {
    if (!assigneeId) return;

    const member = await this.teamMembersRepository.findOne({
      where: [
        { projectId, id: assigneeId, isActive: true },
        { projectId, userId: assigneeId, isActive: true },
      ],
    });

    if (!member) {
      throw new BadRequestException(
        'El responsable debe ser un miembro activo del proyecto',
      );
    }
  }

  private async generateKey(projectId: string): Promise<string> {
    const project = await this.projectsRepository.findOne({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    if (!project.key) throw new BadRequestException(`Project must have a key (e.g. "WEB") to create tickets`);

    const count = await this.ticketsRepository.count({ where: { projectId } });
    return `${project.key}-${count + 1}`;
  }

  async create(projectId: string, dto: CreateTicketDto): Promise<Ticket> {
    await this.assertProjectMemberAssignee(projectId, dto.assigneeId);
    const key = await this.generateKey(projectId);
    const ticket = this.ticketsRepository.create({ ...dto, projectId, key });
    const saved = await this.ticketsRepository.save(ticket);

    if (saved.type === TicketType.SUPPORT) {
      const detail = this.supportDetailsRepository.create({ ticketId: saved.id, isBillable: true });
      await this.supportDetailsRepository.save(detail);
    }

    return saved;
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
    if (dto.assigneeId !== undefined) {
      await this.assertProjectMemberAssignee(projectId, dto.assigneeId);
    }
    Object.assign(ticket, dto);
    return this.ticketsRepository.save(ticket);
  }

  async remove(projectId: string, id: string): Promise<void> {
    const ticket = await this.findOne(projectId, id);
    await this.ticketsRepository.remove(ticket);
  }
}
