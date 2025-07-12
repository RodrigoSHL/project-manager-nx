import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto, GranularUpdateProjectDto } from './dto/update-project.dto';
import { ProjectStatus, ProjectPriority } from './entities/project.entity';
import { NotFoundException } from '@nestjs/common';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: ProjectsService;

  const mockProjectsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    granularUpdate: jest.fn(),
    remove: jest.fn(),
    findByStatus: jest.fn(),
    findByBusinessUnit: jest.fn(),
    getProjectStats: jest.fn(),
    runSeed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
      ],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
    service = module.get<ProjectsService>(ProjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new project', async () => {
      const createProjectDto: CreateProjectDto = {
        name: 'Test Project',
        businessUnit: 'Test Unit',
        description: 'Test Description',
      };

      const expectedProject = {
        id: 'test-id',
        ...createProjectDto,
        status: ProjectStatus.PLANNING,
        priority: ProjectPriority.MEDIUM,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockProjectsService.create.mockResolvedValue(expectedProject);

      const result = await controller.create(createProjectDto);

      expect(service.create).toHaveBeenCalledWith(createProjectDto);
      expect(result).toEqual(expectedProject);
    });
  });

  describe('findAll', () => {
    it('should return all projects', async () => {
      const expectedProjects = [
        {
          id: '1',
          name: 'Project 1',
          businessUnit: 'Unit 1',
          description: 'Description 1',
        },
        {
          id: '2',
          name: 'Project 2',
          businessUnit: 'Unit 2',
          description: 'Description 2',
        },
      ];

      mockProjectsService.findAll.mockResolvedValue(expectedProjects);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedProjects);
    });
  });

  describe('findOne', () => {
    it('should return a project by id', async () => {
      const projectId = 'test-id';
      const expectedProject = {
        id: projectId,
        name: 'Test Project',
        businessUnit: 'Test Unit',
        description: 'Test Description',
      };

      mockProjectsService.findOne.mockResolvedValue(expectedProject);

      const result = await controller.findOne(projectId);

      expect(service.findOne).toHaveBeenCalledWith(projectId);
      expect(result).toEqual(expectedProject);
    });

    it('should throw NotFoundException when project not found', async () => {
      const projectId = 'non-existent-id';

      mockProjectsService.findOne.mockRejectedValue(new NotFoundException(`Proyecto con ID ${projectId} no encontrado`));

      await expect(controller.findOne(projectId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const projectId = 'test-id';
      const updateProjectDto: UpdateProjectDto = {
        name: 'Updated Project',
        description: 'Updated Description',
      };

      const expectedProject = {
        id: projectId,
        ...updateProjectDto,
        businessUnit: 'Test Unit',
        status: ProjectStatus.PRODUCTION,
      };

      mockProjectsService.update.mockResolvedValue(expectedProject);

      const result = await controller.update(projectId, updateProjectDto);

      expect(service.update).toHaveBeenCalledWith(projectId, updateProjectDto);
      expect(result).toEqual(expectedProject);
    });
  });

  describe('granularUpdate', () => {
    it('should perform granular update', async () => {
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

      const expectedProject = {
        id: projectId,
        name: 'Test Project',
        businessUnit: 'Test Unit',
        description: 'Test Description',
        teamMembers: [
          {
            id: 'member-1',
            name: 'New Member',
            email: 'new@test.com',
            role: 'developer',
          },
        ],
      };

      mockProjectsService.granularUpdate.mockResolvedValue(expectedProject);

      const result = await controller.granularUpdate(projectId, granularUpdateDto);

      expect(service.granularUpdate).toHaveBeenCalledWith(projectId, granularUpdateDto);
      expect(result).toEqual(expectedProject);
    });
  });

  describe('remove', () => {
    it('should remove a project', async () => {
      const projectId = 'test-id';

      mockProjectsService.remove.mockResolvedValue(undefined);

      await controller.remove(projectId);

      expect(service.remove).toHaveBeenCalledWith(projectId);
    });
  });

  describe('findByStatus', () => {
    it('should return projects by status', async () => {
      const status = ProjectStatus.PRODUCTION;
      const expectedProjects = [
        {
          id: '1',
          name: 'Production Project',
          status,
        },
      ];

      mockProjectsService.findByStatus.mockResolvedValue(expectedProjects);

      const result = await controller.findByStatus(status);

      expect(service.findByStatus).toHaveBeenCalledWith(status);
      expect(result).toEqual(expectedProjects);
    });
  });

  describe('findByBusinessUnit', () => {
    it('should return projects by business unit', async () => {
      const businessUnit = 'Test Unit';
      const expectedProjects = [
        {
          id: '1',
          name: 'Test Project',
          businessUnit,
        },
      ];

      mockProjectsService.findByBusinessUnit.mockResolvedValue(expectedProjects);

      const result = await controller.findByBusinessUnit(businessUnit);

      expect(service.findByBusinessUnit).toHaveBeenCalledWith(businessUnit);
      expect(result).toEqual(expectedProjects);
    });
  });

  describe('getStats', () => {
    it('should return project statistics', async () => {
      const expectedStats = {
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

      mockProjectsService.getProjectStats.mockResolvedValue(expectedStats);

      const result = await controller.getStats();

      expect(service.getProjectStats).toHaveBeenCalled();
      expect(result).toEqual(expectedStats);
    });
  });

  describe('runSeed', () => {
    it('should run seed successfully', async () => {
      const expectedResult = {
        message: 'Seed ejecutado correctamente',
        data: {
          project: 'project-1',
          technologies: 6,
          repositories: 1,
          environments: 3,
          teamMembers: 3,
          tasks: 3,
          cloudServices: 3,
          usefulLinks: 4,
        },
      };

      mockProjectsService.runSeed.mockResolvedValue(expectedResult);

      const result = await controller.runSeed();

      expect(service.runSeed).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });
}); 