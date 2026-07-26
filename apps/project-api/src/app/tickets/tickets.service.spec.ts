import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Project } from '../projects/entities/project.entity';
import { TeamMember } from '../projects/entities/team-member.entity';
import { TicketSupportDetail } from '../support-details/entities/ticket-support-detail.entity';
import { Ticket, TicketStatus } from './entities/ticket.entity';
import { TicketsService } from './tickets.service';

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
  const projectsRepository = {
    findOne: jest.fn(),
  };
  const supportDetailsRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };
  const teamMembersRepository = {
    findOne: jest.fn(),
  };

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
          provide: getRepositoryToken(Project),
          useValue: projectsRepository,
        },
        {
          provide: getRepositoryToken(TicketSupportDetail),
          useValue: supportDetailsRepository,
        },
        {
          provide: getRepositoryToken(TeamMember),
          useValue: teamMembersRepository,
        },
      ],
    }).compile();

    service = module.get(TicketsService);
    projectsRepository.findOne.mockResolvedValue({ id: 'project-1', key: 'WEB' });
    ticketsRepository.count.mockResolvedValue(0);
    ticketsRepository.create.mockImplementation(data => data);
    ticketsRepository.save.mockImplementation(ticket => Promise.resolve(ticket));
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
});
