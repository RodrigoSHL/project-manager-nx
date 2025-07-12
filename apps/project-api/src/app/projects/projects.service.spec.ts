import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectsService } from './projects.service';
import { Project, ProjectStatus, ProjectPriority } from './entities/project.entity';
import { Technology } from './entities/technology.entity';
import { TeamMember } from './entities/team-member.entity';
import { Task } from './entities/task.entity';
import { Environment } from './entities/environment.entity';
import { Repository as ProjectRepository } from './entities/repository.entity';
import { CloudService } from './entities/cloud-service.entity';
import { UsefulLink } from './entities/useful-link.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto, GranularUpdateProjectDto } from './dto/update-project.dto';
import { NotFoundException } from '@nestjs/common';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectRepository: Repository<Project>;
  let technologyRepository: Repository<Technology>;
  let teamMemberRepository: Repository<TeamMember>;
  let taskRepository: Repository<Task>;
  let environmentRepository: Repository<Environment>;
  let projectRepositoryEntity: Repository<ProjectRepository>;
  let cloudServiceRepository: Repository<CloudService>;
  let usefulLinkRepository: Repository<UsefulLink>;

  const mockProjectRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
    remove: jest.fn(),
  };

  const mockTechnologyRepository = {
    save: jest.fn(),
    findByIds: jest.fn(),
  };

  const mockTeamMemberRepository = {
    save: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  };

  const mockTaskRepository = {
    save: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  };

  const mockEnvironmentRepository = {
    save: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  };

  const mockProjectRepositoryEntity = {
    save: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  };

  const mockCloudServiceRepository = {
    save: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  };

  const mockUsefulLinkRepository = {
    save: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
        {
          provide: getRepositoryToken(Technology),
          useValue: mockTechnologyRepository,
        },
        {
          provide: getRepositoryToken(TeamMember),
          useValue: mockTeamMemberRepository,
        },
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: getRepositoryToken(Environment),
          useValue: mockEnvironmentRepository,
        },
        {
          provide: getRepositoryToken(ProjectRepository),
          useValue: mockProjectRepositoryEntity,
        },
        {
          provide: getRepositoryToken(CloudService),
          useValue: mockCloudServiceRepository,
        },
        {
          provide: getRepositoryToken(UsefulLink),
          useValue: mockUsefulLinkRepository,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    projectRepository = module.get<Repository<Project>>(getRepositoryToken(Project));
    technologyRepository = module.get<Repository<Technology>>(getRepositoryToken(Technology));
    teamMemberRepository = module.get<Repository<TeamMember>>(getRepositoryToken(TeamMember));
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    environmentRepository = module.get<Repository<Environment>>(getRepositoryToken(Environment));
    projectRepositoryEntity = module.get<Repository<ProjectRepository>>(getRepositoryToken(ProjectRepository));
    cloudServiceRepository = module.get<Repository<CloudService>>(getRepositoryToken(CloudService));
    usefulLinkRepository = module.get<Repository<UsefulLink>>(getRepositoryToken(UsefulLink));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new project with basic data', async () => {
      const createProjectDto: CreateProjectDto = {
        name: 'Test Project',
        businessUnit: 'Test Unit',
        description: 'Test Description',
      };

      const mockProject = {
        id: 'test-id',
        ...createProjectDto,
        status: ProjectStatus.PLANNING,
        priority: ProjectPriority.MEDIUM,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProjectRepository.create.mockReturnValue(mockProject);
      mockProjectRepository.save.mockResolvedValue(mockProject);

      const result = await service.create(createProjectDto);

      expect(mockProjectRepository.create).toHaveBeenCalledWith(createProjectDto);
      expect(mockProjectRepository.save).toHaveBeenCalledWith(mockProject);
      expect(result).toEqual(mockProject);
    });
  });

  describe('findAll', () => {
    it('should return all projects with relations', async () => {
      const mockProjects = [
        {
          id: '1',
          name: 'Project 1',
          businessUnit: 'Unit 1',
          description: 'Description 1',
          repositories: [],
          environments: [],
          teamMembers: [],
          tasks: [],
          technologies: [],
          cloudServices: [],
          usefulLinks: [],
        },
        {
          id: '2',
          name: 'Project 2',
          businessUnit: 'Unit 2',
          description: 'Description 2',
          repositories: [],
          environments: [],
          teamMembers: [],
          tasks: [],
          technologies: [],
          cloudServices: [],
          usefulLinks: [],
        },
      ];

      mockProjectRepository.find.mockResolvedValue(mockProjects);

      const result = await service.findAll();

      expect(mockProjectRepository.find).toHaveBeenCalledWith({
        relations: [
          'repositories',
          'environments',
          'teamMembers',
          'tasks',
          'technologies',
          'cloudServices',
          'usefulLinks'
        ],
        order: {
          createdAt: 'DESC'
        }
      });
      expect(result).toEqual(mockProjects);
    });
  });

  describe('findOne', () => {
    it('should return a project by id', async () => {
      const projectId = 'test-id';
      const mockProject = {
        id: projectId,
        name: 'Test Project',
        businessUnit: 'Test Unit',
        description: 'Test Description',
        repositories: [],
        environments: [],
        teamMembers: [],
        tasks: [],
        technologies: [],
        cloudServices: [],
        usefulLinks: [],
      };

      mockProjectRepository.findOne.mockResolvedValue(mockProject);

      const result = await service.findOne(projectId);

      expect(mockProjectRepository.findOne).toHaveBeenCalledWith({
        where: { id: projectId },
        relations: [
          'repositories',
          'environments',
          'teamMembers',
          'tasks',
          'technologies',
          'cloudServices',
          'usefulLinks'
        ]
      });
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException when project not found', async () => {
      const projectId = 'non-existent-id';

      mockProjectRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(projectId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(projectId)).rejects.toThrow(`Proyecto con ID ${projectId} no encontrado`);
    });
  });

  describe('update', () => {
    it('should update project basic fields', async () => {
      const projectId = 'test-id';
      const updateProjectDto: UpdateProjectDto = {
        name: 'Updated Project',
        description: 'Updated Description',
        status: ProjectStatus.PRODUCTION,
      };

      const existingProject = {
        id: projectId,
        name: 'Original Project',
        businessUnit: 'Test Unit',
        description: 'Original Description',
        status: ProjectStatus.PLANNING,
        repositories: [],
        environments: [],
        teamMembers: [],
        tasks: [],
        technologies: [],
        cloudServices: [],
        usefulLinks: [],
      };

      const updatedProject = {
        ...existingProject,
        ...updateProjectDto,
      };

      mockProjectRepository.findOne.mockResolvedValue(existingProject);
      mockProjectRepository.save.mockResolvedValue(updatedProject);

      const result = await service.update(projectId, updateProjectDto);

      expect(mockProjectRepository.save).toHaveBeenCalledWith(updatedProject);
      expect(result).toEqual(updatedProject);
    });

    it('should update project with repositories', async () => {
      const projectId = 'test-id';
      const updateProjectDto: UpdateProjectDto = {
        repositories: [
          {
            name: 'test-repo',
            url: 'https://github.com/test/repo',
            description: 'Test repository',
          },
        ],
      };

      const existingProject = {
        id: projectId,
        name: 'Test Project',
        businessUnit: 'Test Unit',
        description: 'Test Description',
        repositories: [],
        environments: [],
        teamMembers: [],
        tasks: [],
        technologies: [],
        cloudServices: [],
        usefulLinks: [],
      };

      mockProjectRepository.findOne.mockResolvedValue(existingProject);
      mockProjectRepository.save.mockResolvedValue(existingProject);
      mockProjectRepositoryEntity.create.mockReturnValue({ projectId });
      mockProjectRepositoryEntity.save.mockResolvedValue({});

      const result = await service.update(projectId, updateProjectDto);

      expect(mockProjectRepositoryEntity.delete).toHaveBeenCalledWith({ projectId });
      expect(mockProjectRepositoryEntity.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('granularUpdate', () => {
    it('should add new team members', async () => {
      const projectId = 'test-id';
      const granularUpdateDto: GranularUpdateProjectDto = {
        teamMembers: {
          add: [
            {
              name: 'New Member',
              email: 'new@test.com',
              role: 'developer',
            },
          ],
        },
      };

      const existingProject = {
        id: projectId,
        name: 'Test Project',
        businessUnit: 'Test Unit',
        description: 'Test Description',
        repositories: [],
        environments: [],
        teamMembers: [],
        tasks: [],
        technologies: [],
        cloudServices: [],
        usefulLinks: [],
      };

      mockProjectRepository.findOne.mockResolvedValue(existingProject);
      mockProjectRepository.save.mockResolvedValue(existingProject);
      mockTeamMemberRepository.create.mockReturnValue({ projectId });
      mockTeamMemberRepository.save.mockResolvedValue({});

      const result = await service.granularUpdate(projectId, granularUpdateDto);

      expect(mockTeamMemberRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should update existing team members', async () => {
      const projectId = 'test-id';
      const granularUpdateDto: GranularUpdateProjectDto = {
        teamMembers: {
          update: [
            {
              id: 'member-id',
              role: 'tech_lead',
            },
          ],
        },
      };

      const existingProject = {
        id: projectId,
        name: 'Test Project',
        businessUnit: 'Test Unit',
        description: 'Test Description',
        repositories: [],
        environments: [],
        teamMembers: [],
        tasks: [],
        technologies: [],
        cloudServices: [],
        usefulLinks: [],
      };

      mockProjectRepository.findOne.mockResolvedValue(existingProject);
      mockProjectRepository.save.mockResolvedValue(existingProject);

      const result = await service.granularUpdate(projectId, granularUpdateDto);

      expect(mockTeamMemberRepository.update).toHaveBeenCalledWith('member-id', { id: 'member-id', role: 'tech_lead' });
      expect(result).toBeDefined();
    });

    it('should delete team members', async () => {
      const projectId = 'test-id';
      const granularUpdateDto: GranularUpdateProjectDto = {
        teamMembers: {
          delete: ['member-id-1', 'member-id-2'],
        },
      };

      const existingProject = {
        id: projectId,
        name: 'Test Project',
        businessUnit: 'Test Unit',
        description: 'Test Description',
        repositories: [],
        environments: [],
        teamMembers: [],
        tasks: [],
        technologies: [],
        cloudServices: [],
        usefulLinks: [],
      };

      mockProjectRepository.findOne.mockResolvedValue(existingProject);
      mockProjectRepository.save.mockResolvedValue(existingProject);

      const result = await service.granularUpdate(projectId, granularUpdateDto);

      expect(mockTeamMemberRepository.delete).toHaveBeenCalledWith(['member-id-1', 'member-id-2']);
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should remove a project', async () => {
      const projectId = 'test-id';
      const mockProject = {
        id: projectId,
        name: 'Test Project',
        businessUnit: 'Test Unit',
        description: 'Test Description',
      };

      mockProjectRepository.findOne.mockResolvedValue(mockProject);
      mockProjectRepository.remove.mockResolvedValue(mockProject);

      await service.remove(projectId);

      expect(mockProjectRepository.remove).toHaveBeenCalledWith(mockProject);
    });
  });

  describe('findByStatus', () => {
    it('should return projects by status', async () => {
      const status = ProjectStatus.PRODUCTION;
      const mockProjects = [
        {
          id: '1',
          name: 'Project 1',
          status,
          repositories: [],
          environments: [],
          teamMembers: [],
          tasks: [],
          technologies: [],
          cloudServices: [],
          usefulLinks: [],
        },
      ];

      mockProjectRepository.find.mockResolvedValue(mockProjects);

      const result = await service.findByStatus(status);

      expect(mockProjectRepository.find).toHaveBeenCalledWith({
        where: { status },
        relations: [
          'repositories',
          'environments',
          'teamMembers',
          'tasks',
          'technologies',
          'cloudServices',
          'usefulLinks'
        ]
      });
      expect(result).toEqual(mockProjects);
    });
  });

  describe('findByBusinessUnit', () => {
    it('should return projects by business unit', async () => {
      const businessUnit = 'Test Unit';
      const mockProjects = [
        {
          id: '1',
          name: 'Project 1',
          businessUnit,
          repositories: [],
          environments: [],
          teamMembers: [],
          tasks: [],
          technologies: [],
          cloudServices: [],
          usefulLinks: [],
        },
      ];

      mockProjectRepository.find.mockResolvedValue(mockProjects);

      const result = await service.findByBusinessUnit(businessUnit);

      expect(mockProjectRepository.find).toHaveBeenCalledWith({
        where: { businessUnit },
        relations: [
          'repositories',
          'environments',
          'teamMembers',
          'tasks',
          'technologies',
          'cloudServices',
          'usefulLinks'
        ]
      });
      expect(result).toEqual(mockProjects);
    });
  });

  describe('getProjectStats', () => {
    it('should return project statistics', async () => {
      const mockStats = {
        totalProjects: 10,
        byStatus: [
          { status: 'production', count: '5' },
          { status: 'development', count: '3' },
        ],
        byPriority: [
          { priority: 'high', count: '4' },
          { priority: 'medium', count: '6' },
        ],
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn(),
      };

      mockProjectRepository.count.mockResolvedValue(10);
      mockProjectRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.getRawMany
        .mockResolvedValueOnce(mockStats.byStatus)
        .mockResolvedValueOnce(mockStats.byPriority);

      const result = await service.getProjectStats();

      expect(mockProjectRepository.count).toHaveBeenCalled();
      expect(mockProjectRepository.createQueryBuilder).toHaveBeenCalledWith('project');
      expect(result).toEqual(mockStats);
    });
  });

}); 