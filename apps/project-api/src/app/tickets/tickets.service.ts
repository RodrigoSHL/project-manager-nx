import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Ticket, TicketType } from './entities/ticket.entity';
import { TicketSupportDetail } from '../support-details/entities/ticket-support-detail.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TeamMember } from '../projects/entities/team-member.entity';
import { Sprint } from '../sprints/entities/sprint.entity';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepository: Repository<Ticket>,
    @InjectRepository(TeamMember)
    private readonly teamMembersRepository: Repository<TeamMember>,
    @InjectRepository(Sprint)
    private readonly sprintsRepository: Repository<Sprint>,
    private readonly dataSource: DataSource,
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

  private async generateKey(manager: EntityManager, projectId: string): Promise<string> {
    // UPDATE locks this project's row until the ticket transaction commits.
    // Concurrent requests receive distinct numbers and failures roll back both writes.
    const [project] = await manager.query(
      `WITH allocated AS (UPDATE "projects"
       SET "lastTicketNumber" = "lastTicketNumber" + 1
       WHERE "id" = $1
       RETURNING "key", "lastTicketNumber")
       SELECT "key", "lastTicketNumber" FROM allocated`,
      [projectId],
    );
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    if (!project.key) throw new BadRequestException(`Project must have a key (e.g. "WEB") to create tickets`);

    return `${project.key}-${project.lastTicketNumber}`;
  }

  private async assertValidEpic(
    projectId: string,
    type: TicketType,
    epicId?: string | null,
  ): Promise<void> {
    if (type !== TicketType.STORY) {
      if (epicId) {
        throw new BadRequestException(
          'Solo las historias de usuario pueden vincularse a una épica',
        );
      }
      return;
    }

    if (!epicId) {
      throw new BadRequestException(
        'La historia de usuario debe estar vinculada a una épica',
      );
    }

    const epic = await this.ticketsRepository.findOne({
      where: { id: epicId, projectId, type: TicketType.EPIC },
    });
    if (!epic) {
      throw new BadRequestException(
        'La épica seleccionada no existe o pertenece a otro proyecto',
      );
    }
  }

  private async assertEpicHasNoStories(ticket: Ticket): Promise<void> {
    if (ticket.type !== TicketType.EPIC) return;

    const stories = await this.ticketsRepository.count({
      where: { epicId: ticket.id },
    });
    if (stories > 0) {
      throw new BadRequestException(
        'La épica tiene historias vinculadas. Reasígnalas antes de continuar',
      );
    }
  }

  async create(projectId: string, dto: CreateTicketDto): Promise<Ticket> {
    await this.findProjectSprint(projectId, dto.sprintId);
    await this.assertProjectMemberAssignee(projectId, dto.assigneeId);
    await this.assertValidEpic(
      projectId,
      dto.type ?? TicketType.TASK,
      dto.epicId,
    );
    return this.dataSource.transaction(async (manager) => {
      const key = await this.generateKey(manager, projectId);
      const tickets = manager.getRepository(Ticket);
      const ticket = tickets.create({ ...dto, projectId, key });
      const saved = await tickets.save(ticket);

      if (saved.type === TicketType.SUPPORT) {
        const details = manager.getRepository(TicketSupportDetail);
        const detail = details.create({ ticketId: saved.id, isBillable: true });
        await details.save(detail);
      }

      return saved;
    });
  }

  findByProject(projectId: string): Promise<Ticket[]> {
    return this.ticketsRepository.find({
      where: { projectId },
      relations: ['labels', 'epic'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(projectId: string, id: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { id, projectId },
      relations: ['labels', 'sprint', 'epic'],
    });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    // Legacy invalid links must not expose another project's sprint.
    if (ticket.sprint && ticket.sprint.projectId !== ticket.projectId) {
      ticket.sprint = null;
      ticket.sprintId = null;
    }
    return ticket;
  }

  private async findProjectSprint(projectId: string, sprintId?: string | null) {
    if (sprintId === undefined || sprintId === null) return null;
    const sprint = await this.sprintsRepository.findOne({ where: { id: sprintId, projectId } });
    if (!sprint) {
      throw new BadRequestException('El sprint seleccionado no existe o pertenece a otro proyecto');
    }
    return sprint;
  }

  async update(projectId: string, id: string, dto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findOne(projectId, id);
    if (dto.sprintId !== undefined) {
      const sprint = await this.findProjectSprint(projectId, dto.sprintId);
      // Keep the loaded relation in sync so TypeORM saves the selected sprintId.
      ticket.sprint = sprint;
    }
    if (dto.assigneeId !== undefined) {
      await this.assertProjectMemberAssignee(projectId, dto.assigneeId);
    }

    if (dto.type !== undefined || dto.epicId !== undefined) {
      const nextType = dto.type ?? ticket.type;
      const nextEpicId = nextType === TicketType.STORY
        ? (dto.epicId !== undefined ? dto.epicId : ticket.epicId)
        : null;

      if (ticket.type === TicketType.EPIC && nextType !== TicketType.EPIC) {
        await this.assertEpicHasNoStories(ticket);
      }
      await this.assertValidEpic(projectId, nextType, nextEpicId);
      dto.epicId = nextEpicId;
    }
    Object.assign(ticket, dto);
    return this.ticketsRepository.save(ticket);
  }

  async remove(projectId: string, id: string): Promise<void> {
    const ticket = await this.findOne(projectId, id);
    await this.assertEpicHasNoStories(ticket);
    await this.ticketsRepository.remove(ticket);
  }
}
