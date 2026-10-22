import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Not, Repository } from 'typeorm';
import { Sprint } from './entities/sprint.entity';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { CompleteSprintDto } from './dto/complete-sprint.dto';
import { Ticket, TicketStatus } from '../tickets/entities/ticket.entity';

@Injectable()
export class SprintsService {
  constructor(
    @InjectRepository(Sprint)
    private readonly sprintsRepository: Repository<Sprint>,
    private readonly dataSource: DataSource,
  ) {}

  async create(projectId: string, dto: CreateSprintDto): Promise<Sprint> {
    const sprint = this.sprintsRepository.create({ ...dto, projectId });
    return this.sprintsRepository.save(sprint);
  }

  findByProject(projectId: string): Promise<Sprint[]> {
    return this.sprintsRepository.find({ where: { projectId }, order: { createdAt: 'DESC' } });
  }

  async findOne(projectId: string, id: string, repository = this.sprintsRepository): Promise<Sprint> {
    const sprint = await repository.findOne({ where: { id, projectId } });
    if (!sprint) throw new NotFoundException(`Sprint ${id} not found`);
    return sprint;
  }

  private withProjectLock<T>(projectId: string, operation: (manager: EntityManager) => Promise<T>) {
    return this.dataSource.transaction(async manager => {
      // Ticket writes take the same lock, so a close cannot miss a concurrent assignment.
      const rows = await manager.query('SELECT "id" FROM "projects" WHERE "id" = $1 FOR UPDATE', [projectId]);
      if (!rows.length) throw new NotFoundException(`Project ${projectId} not found`);
      return operation(manager);
    });
  }

  private assertOpen(sprint: Sprint) {
    if (sprint.completedAt) throw new ConflictException('El sprint ya está finalizado');
  }

  async update(projectId: string, id: string, dto: UpdateSprintDto): Promise<Sprint> {
    return this.withProjectLock(projectId, async manager => {
      const repository = manager.getRepository(Sprint);
      const sprint = await this.findOne(projectId, id, repository);
      this.assertOpen(sprint);
      Object.assign(sprint, dto);
      return repository.save(sprint);
    });
  }

  async activate(projectId: string, id: string): Promise<Sprint> {
    return this.withProjectLock(projectId, async manager => {
      const repository = manager.getRepository(Sprint);
      const sprint = await this.findOne(projectId, id, repository);
      this.assertOpen(sprint);
      if (sprint.isActive) throw new ConflictException('Sprint is already active');
      await repository.update({ projectId, isActive: true }, { isActive: false });
      sprint.isActive = true;
      return repository.save(sprint);
    });
  }

  async complete(projectId: string, id: string, dto: CompleteSprintDto): Promise<Sprint> {
    return this.withProjectLock(projectId, async manager => {
      const repository = manager.getRepository(Sprint);
      const sprint = await this.findOne(projectId, id, repository);
      this.assertOpen(sprint);
      if (!sprint.isActive) throw new ConflictException('Solo puedes finalizar el sprint activo');

      const target = dto.targetSprintId
        ? await this.findOne(projectId, dto.targetSprintId, repository) : null;
      if (target?.id === sprint.id) throw new BadRequestException('Selecciona un sprint diferente como destino');
      if (target) this.assertOpen(target);

      const tickets = manager.getRepository(Ticket);
      const sprintTickets = await tickets.find({ where: { projectId, sprintId: sprint.id } });
      const done = sprintTickets.filter(ticket => ticket.status === TicketStatus.DONE);
      const cancelled = sprintTickets.filter(ticket => ticket.status === TicketStatus.CANCELLED);
      const moved = sprintTickets.length - done.length - cancelled.length;
      sprint.completionSummary = {
        totalTickets: sprintTickets.length,
        doneTickets: done.length,
        cancelledTickets: cancelled.length,
        movedTickets: moved,
        totalStoryPoints: sprintTickets.reduce((sum, ticket) => sum + (ticket.storyPoints || 0), 0),
        completedStoryPoints: done.reduce((sum, ticket) => sum + (ticket.storyPoints || 0), 0),
        targetSprintId: target?.id ?? null,
        targetSprintName: target?.name ?? null,
        tickets: sprintTickets.map(({ id, key, title, status, storyPoints }) => ({ id, key, title, status, storyPoints })),
      };
      const pendingCriteria = { projectId, sprintId: sprint.id, status: Not(In([TicketStatus.DONE, TicketStatus.CANCELLED])) };
      if (target) {
        // Preserve ongoing work; legacy backlog tickets become ready for the sprint.
        await tickets.update({ ...pendingCriteria, status: TicketStatus.BACKLOG }, { sprintId: target.id, status: TicketStatus.TODO });
        await tickets.update(pendingCriteria, { sprintId: target.id });
      } else {
        await tickets.update(pendingCriteria, { sprintId: null, status: TicketStatus.BACKLOG });
      }
      sprint.isActive = false;
      sprint.completedAt = new Date();
      return repository.save(sprint);
    });
  }

  async remove(projectId: string, id: string): Promise<void> {
    return this.withProjectLock(projectId, async manager => {
      const repository = manager.getRepository(Sprint);
      const sprint = await this.findOne(projectId, id, repository);
      this.assertOpen(sprint);
      if (await manager.getRepository(Ticket).count({ where: { projectId, sprintId: sprint.id } })) {
        throw new ConflictException('No puedes eliminar un sprint con tickets');
      }
      await repository.remove(sprint);
    });
  }
}
