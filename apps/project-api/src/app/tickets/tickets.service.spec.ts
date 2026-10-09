import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TeamMember } from '../projects/entities/team-member.entity';
import { TicketSupportDetail } from '../support-details/entities/ticket-support-detail.entity';
import { Ticket, TicketStatus, TicketType } from './entities/ticket.entity';
import { TicketsService } from './tickets.service';
import { Sprint } from '../sprints/entities/sprint.entity';

describe('TicketsService', () => {
  let service: TicketsService;

  const ticketsRepository = {
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };
  const supportDetailsRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };
  const teamMembersRepository = {
    findOne: jest.fn(),
  };
  const sprintsRepository = { findOne: jest.fn() };
  const manager = {
    query: jest.fn(),
    getRepository: jest.fn(),
  };
  const dataSource = { transaction: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: getRepositoryToken(Ticket),
          useValue: ticketsRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: getRepositoryToken(TeamMember),
          useValue: teamMembersRepository,
        },
        { provide: getRepositoryToken(Sprint), useValue: sprintsRepository },
      ],
    }).compile();

    service = module.get(TicketsService);
    manager.query.mockResolvedValue([{ key: 'WEB', lastTicketNumber: 1 }]);
    manager.getRepository.mockImplementation(entity => entity === Ticket ? ticketsRepository : supportDetailsRepository);
    dataSource.transaction.mockImplementation(callback => callback(manager));
    ticketsRepository.count.mockResolvedValue(0);
    ticketsRepository.create.mockImplementation(data => data);
    ticketsRepository.save.mockImplementation(ticket => Promise.resolve(ticket));
    supportDetailsRepository.create.mockImplementation(data => data);
    supportDetailsRepository.save.mockImplementation(detail => Promise.resolve(detail));
  });

  it('uses the allocated number instead of counting existing tickets', async () => {
    manager.query.mockResolvedValue([{ key: 'SP2', lastTicketNumber: 45 }]);
    ticketsRepository.count.mockResolvedValue(34);
    expect(await service.create('project-1', { title: 'After deleted tickets' }))
      .toMatchObject({ key: 'SP2-45' });
    expect(ticketsRepository.count).not.toHaveBeenCalled();
    expect(manager.query).toHaveBeenCalledWith(expect.stringContaining('RETURNING'), ['project-1']);
  });

  it('rejects a missing project before saving', async () => {
    manager.query.mockResolvedValue([]);
    await expect(service.create('missing', { title: 'Missing' })).rejects.toBeInstanceOf(NotFoundException);
    expect(ticketsRepository.save).not.toHaveBeenCalled();
  });

  it('rejects a project without a key before saving', async () => {
    manager.query.mockResolvedValue([{ key: null, lastTicketNumber: 1 }]);
    await expect(service.create('project-1', { title: 'Missing key' })).rejects.toBeInstanceOf(BadRequestException);
    expect(ticketsRepository.save).not.toHaveBeenCalled();
  });

  it('creates support details using the ticket transaction', async () => {
    const saved = await service.create('project-1', { title: 'Support', type: TicketType.SUPPORT });
    expect(manager.getRepository).toHaveBeenCalledWith(TicketSupportDetail);
    expect(supportDetailsRepository.save).toHaveBeenCalledWith({ ticketId: saved.id, isBillable: true });
  });

  it('creates a ticket assigned to an active project member', async () => {
    teamMembersRepository.findOne.mockResolvedValue({
      id: 'member-1',
      userId: '00000000-0000-4000-8000-000000000001',
      projectId: 'project-1',
      isActive: true,
    });

    const result = await service.create('project-1', {
      title: 'Assigned ticket',
      assigneeId: '00000000-0000-4000-8000-000000000001',
    });

    expect(teamMembersRepository.findOne).toHaveBeenCalledWith({
      where: [
        {
          projectId: 'project-1',
          id: '00000000-0000-4000-8000-000000000001',
          isActive: true,
        },
        {
          projectId: 'project-1',
          userId: '00000000-0000-4000-8000-000000000001',
          isActive: true,
        },
      ],
    });
    expect(result).toMatchObject({
      title: 'Assigned ticket',
      assigneeId: '00000000-0000-4000-8000-000000000001',
      projectId: 'project-1',
      key: 'WEB-1',
    });
  });

  it('rejects an assignee that is not a project member', async () => {
    teamMembersRepository.findOne.mockResolvedValue(null);

    await expect(service.create('project-1', {
      title: 'Invalid assignee',
      assigneeId: '00000000-0000-4000-8000-000000000099',
    })).rejects.toBeInstanceOf(BadRequestException);

    expect(ticketsRepository.save).not.toHaveBeenCalled();
  });

  it('allows a ticket to remain unassigned', async () => {
    const result = await service.create('project-1', {
      title: 'Unassigned ticket',
      assigneeId: null,
    });

    expect(teamMembersRepository.findOne).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      title: 'Unassigned ticket',
      assigneeId: null,
    });
  });

  it('creates a story linked to an epic from the same project', async () => {
    ticketsRepository.findOne.mockResolvedValue({
      id: 'epic-1',
      projectId: 'project-1',
      type: TicketType.EPIC,
    });

    const result = await service.create('project-1', {
      title: 'User story',
      type: TicketType.STORY,
      epicId: 'epic-1',
    });

    expect(ticketsRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 'epic-1',
        projectId: 'project-1',
        type: TicketType.EPIC,
      },
    });
    expect(result).toMatchObject({
      title: 'User story',
      type: TicketType.STORY,
      epicId: 'epic-1',
    });
  });

  it('rejects a story without an epic', async () => {
    await expect(service.create('project-1', {
      title: 'Orphan story',
      type: TicketType.STORY,
    })).rejects.toBeInstanceOf(BadRequestException);

    expect(ticketsRepository.save).not.toHaveBeenCalled();
  });

  it('rejects a story linked to an invalid epic', async () => {
    ticketsRepository.findOne.mockResolvedValue(null);

    await expect(service.create('project-1', {
      title: 'Story with invalid epic',
      type: TicketType.STORY,
      epicId: '00000000-0000-4000-8000-000000000099',
    })).rejects.toBeInstanceOf(BadRequestException);

    expect(ticketsRepository.save).not.toHaveBeenCalled();
  });

  it('does not delete an epic while it still has stories', async () => {
    ticketsRepository.findOne.mockResolvedValue({
      id: 'epic-1',
      projectId: 'project-1',
      type: TicketType.EPIC,
    });
    ticketsRepository.count.mockResolvedValue(2);

    await expect(service.remove('project-1', 'epic-1'))
      .rejects.toBeInstanceOf(BadRequestException);

    expect(ticketsRepository.remove).not.toHaveBeenCalled();
  });

  it('validates the assignee when updating a ticket', async () => {
    ticketsRepository.findOne.mockResolvedValue({
      id: 'ticket-1',
      projectId: 'project-1',
      title: 'Ticket',
      status: TicketStatus.TODO,
    });
    teamMembersRepository.findOne.mockResolvedValue(null);

    await expect(service.update('project-1', 'ticket-1', {
      assigneeId: '00000000-0000-4000-8000-000000000099',
    })).rejects.toBeInstanceOf(BadRequestException);

    expect(ticketsRepository.save).not.toHaveBeenCalled();
  });

  it('replaces the loaded sprint relation when moving a backlog ticket', async () => {
    ticketsRepository.findOne.mockResolvedValue({
      id: 'ticket-1', projectId: 'project-1', type: TicketType.TASK,
      sprintId: 'old-sprint', sprint: { id: 'old-sprint' }, status: TicketStatus.BACKLOG,
    });
    const sprint = { id: 'active-sprint', projectId: 'project-1', isActive: true };
    sprintsRepository.findOne.mockResolvedValue(sprint);

    const updated = await service.update('project-1', 'ticket-1', {
      sprintId: 'active-sprint', status: TicketStatus.TODO,
    });

    expect(sprintsRepository.findOne).toHaveBeenCalledWith({ where: { id: 'active-sprint', projectId: 'project-1' } });
    expect(updated).toMatchObject({ sprintId: 'active-sprint', sprint, status: TicketStatus.TODO });
    expect(ticketsRepository.save).toHaveBeenCalledWith(expect.objectContaining({ sprintId: sprint.id, sprint }));
  });

  it('clears the loaded sprint relation when returning a ticket to the backlog', async () => {
    ticketsRepository.findOne.mockResolvedValue({
      id: 'ticket-1', projectId: 'project-1', type: TicketType.TASK,
      sprintId: 'old-sprint', sprint: { id: 'old-sprint' },
    });

    const updated = await service.update('project-1', 'ticket-1', { sprintId: null, status: TicketStatus.BACKLOG });

    expect(updated).toMatchObject({ sprintId: null, sprint: null, status: TicketStatus.BACKLOG });
    expect(sprintsRepository.findOne).not.toHaveBeenCalled();
  });

  it('rejects a sprint outside the ticket project', async () => {
    ticketsRepository.findOne.mockResolvedValue({ id: 'ticket-1', projectId: 'project-1', type: TicketType.TASK });
    sprintsRepository.findOne.mockResolvedValue(null);

    await expect(service.update('project-1', 'ticket-1', { sprintId: 'foreign-sprint' }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(ticketsRepository.save).not.toHaveBeenCalled();
  });

  it.each(['foreign-sprint', 'missing-sprint'])('rejects creation with %s before any write', async (sprintId) => {
    sprintsRepository.findOne.mockResolvedValue(null);
    await expect(service.create('project-1', { title: 'Invalid sprint', type: TicketType.SUPPORT, sprintId })).rejects.toBeInstanceOf(BadRequestException);
    expect(sprintsRepository.findOne).toHaveBeenCalledWith({ where: { id: sprintId, projectId: 'project-1' } });
    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(ticketsRepository.save).not.toHaveBeenCalled();
    expect(supportDetailsRepository.save).not.toHaveBeenCalled();
  });

  it('allows creation in an inactive sprint belonging to the project', async () => {
    const sprint = { id: 'own-sprint', projectId: 'project-1', isActive: false };
    sprintsRepository.findOne.mockResolvedValue(sprint);
    expect(await service.create('project-1', { title: 'Valid sprint', sprintId: sprint.id })).toMatchObject({ sprintId: sprint.id });
    expect(sprintsRepository.findOne).toHaveBeenCalledWith({ where: { id: sprint.id, projectId: 'project-1' } });
  });

  it('does not disclose a foreign sprint on a legacy ticket', async () => {
    ticketsRepository.findOne.mockResolvedValue({ id: 'ticket-1', projectId: 'project-1', sprintId: 'foreign', sprint: { id: 'foreign', projectId: 'project-2', name: 'Private sprint' } });
    expect(await service.findOne('project-1', 'ticket-1')).toMatchObject({ sprintId: null, sprint: null });
    expect(ticketsRepository.save).not.toHaveBeenCalled();
  });

  it('preserves a valid sprint on reads and unrelated updates', async () => {
    const sprint = { id: 'own', projectId: 'project-1' };
    ticketsRepository.findOne.mockResolvedValue({ id: 'ticket-1', projectId: 'project-1', sprintId: sprint.id, sprint });
    expect(await service.update('project-1', 'ticket-1', { title: 'Renamed' })).toMatchObject({ sprintId: sprint.id, sprint });
    expect(sprintsRepository.findOne).not.toHaveBeenCalled();
  });

  it('preserves a valid sprint when the route UUID uses uppercase', async () => {
    const canonicalId = '8b087a16-a4b1-494d-9123-e228073c289e';
    const sprint = { id: 'own', projectId: canonicalId };
    ticketsRepository.findOne.mockImplementation(async () => ({ id: 'ticket-1', projectId: canonicalId, sprintId: sprint.id, sprint }));
    expect(await service.findOne(canonicalId.toUpperCase(), 'ticket-1')).toMatchObject({ sprintId: sprint.id, sprint });
    expect(await service.update(canonicalId.toUpperCase(), 'ticket-1', { title: 'Renamed' })).toMatchObject({ sprintId: sprint.id, sprint });
    expect(ticketsRepository.save).toHaveBeenCalledWith(expect.objectContaining({ sprintId: sprint.id, sprint }));
  });

  it('allows explicit null when creating a backlog ticket', async () => {
    expect(await service.create('project-1', { title: 'Backlog', sprintId: null })).toMatchObject({ sprintId: null });
    expect(sprintsRepository.findOne).not.toHaveBeenCalled();
  });
});
