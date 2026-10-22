import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Sprint } from './entities/sprint.entity';
import { SprintsService } from './sprints.service';
import { TicketStatus } from '../tickets/entities/ticket.entity';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CompleteSprintDto } from './dto/complete-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';

describe('Sprint completion', () => {
  let service: SprintsService;
  let source: Sprint;
  let target: Sprint;
  const sprints = { findOne: jest.fn(), save: jest.fn(), update: jest.fn(), remove: jest.fn() };
  const tickets = { find: jest.fn(), update: jest.fn(), count: jest.fn() };
  const manager = { query: jest.fn(), getRepository: jest.fn() };
  const dataSource = { transaction: jest.fn() };
  beforeEach(() => {
    jest.resetAllMocks();
    source = { id: 'source', projectId: 'project', isActive: true, completedAt: null } as Sprint;
    target = { id: 'target', projectId: 'project', name: 'Next sprint', isActive: false, completedAt: null } as Sprint;
    manager.query.mockResolvedValue([{ id: 'project' }]);
    manager.getRepository.mockImplementation(entity => entity === Sprint ? sprints : tickets);
    dataSource.transaction.mockImplementation(callback => callback(manager));
    sprints.findOne.mockImplementation(async ({ where }) => where.id === source.id ? source : where.id === target.id ? target : null);
    sprints.save.mockImplementation(async sprint => sprint);
    tickets.find.mockResolvedValue([
      { id: 'done', key: 'P-1', title: 'Delivered', status: TicketStatus.DONE, storyPoints: 5 },
      { id: 'cancelled', key: 'P-2', title: 'Cancelled', status: TicketStatus.CANCELLED, storyPoints: 2 },
      { id: 'pending', key: 'P-3', title: 'In progress', status: TicketStatus.IN_PROGRESS, storyPoints: 3 },
    ]);
    tickets.count.mockResolvedValue(0);
    service = new SprintsService(sprints as unknown as Repository<Sprint>, dataSource as unknown as DataSource);
  });

  it('closes atomically, retains a snapshot and sends only pending tickets to backlog', async () => {
    const result = await service.complete('project', source.id, {});
    expect(result).toMatchObject({ isActive: false, completedAt: expect.any(Date), completionSummary: {
      totalTickets: 3, doneTickets: 1, cancelledTickets: 1, movedTickets: 1,
      totalStoryPoints: 10, completedStoryPoints: 5, targetSprintId: null, tickets: expect.arrayContaining([expect.objectContaining({ id: 'pending', status: 'in_progress' })]),
    } });
    expect(tickets.update).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'project', sprintId: source.id, status: expect.objectContaining({ _type: 'not' }) }), { sprintId: null, status: 'backlog' });
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.query).toHaveBeenCalledWith(expect.stringContaining('FOR UPDATE'), ['project']);
  });

  it('moves pending work to an open sprint without activating it or resetting progress', async () => {
    const result = await service.complete('project', source.id, { targetSprintId: target.id });
    expect(result.completionSummary).toMatchObject({ targetSprintId: target.id, targetSprintName: target.name });
    expect(tickets.update).toHaveBeenLastCalledWith(expect.objectContaining({ sprintId: source.id }), { sprintId: target.id });
    expect(tickets.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'backlog' }), { sprintId: target.id, status: 'todo' });
    expect(sprints.update).not.toHaveBeenCalled();
  });

  it('supports empty sprints', async () => {
    tickets.find.mockResolvedValue([]);
    expect((await service.complete('project', source.id, {})).completionSummary).toMatchObject({ totalTickets: 0, movedTickets: 0, tickets: [] });
  });

  it.each(['inactive', 'completed'])('rejects closing an %s sprint before moving tickets', async state => {
    if (state === 'inactive') source.isActive = false;
    else source.completedAt = new Date();
    await expect(service.complete('project', source.id, {})).rejects.toBeInstanceOf(ConflictException);
    expect(tickets.update).not.toHaveBeenCalled();
  });

  it('rejects a target belonging to another project', async () => {
    await expect(service.complete('project', source.id, { targetSprintId: 'foreign' })).rejects.toBeInstanceOf(NotFoundException);
    expect(sprints.findOne).toHaveBeenCalledWith({ where: { id: 'foreign', projectId: 'project' } });
    expect(tickets.update).not.toHaveBeenCalled();
  });

  it('rejects the source as its own destination', async () => {
    await expect(service.complete('project', source.id, { targetSprintId: source.id })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects closed targets and prevents reopening, editing or deleting closed sprints', async () => {
    target.completedAt = new Date();
    await expect(service.complete('project', source.id, { targetSprintId: target.id })).rejects.toBeInstanceOf(ConflictException);
    source.completedAt = new Date();
    await expect(service.activate('project', source.id)).rejects.toBeInstanceOf(ConflictException);
    await expect(service.update('project', source.id, { name: 'Changed' })).rejects.toBeInstanceOf(ConflictException);
    await expect(service.remove('project', source.id)).rejects.toBeInstanceOf(ConflictException);
    expect(sprints.save).not.toHaveBeenCalled();
  });

  it('does not save the closed sprint when the ticket transfer fails', async () => {
    tickets.update.mockRejectedValue(new Error('Database write failed'));
    await expect(service.complete('project', source.id, {})).rejects.toThrow('Database write failed');
    expect(sprints.save).not.toHaveBeenCalled();
  });

  it('requires valid destination UUIDs and disallows bypassing lifecycle via PATCH', async () => {
    expect(await validate(plainToInstance(CompleteSprintDto, { targetSprintId: 'invalid' }))).not.toHaveLength(0);
    expect(await validate(plainToInstance(CompleteSprintDto, { targetSprintId: null }))).toHaveLength(0);
    expect(await validate(plainToInstance(UpdateSprintDto, { isActive: true }), { whitelist: true, forbidNonWhitelisted: true })).not.toHaveLength(0);
  });
});
