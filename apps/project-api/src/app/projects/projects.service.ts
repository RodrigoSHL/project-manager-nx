import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project, ProjectStatus } from './entities/project.entity';
import { Technology } from './entities/technology.entity';
import { TeamMember } from './entities/team-member.entity';
import { Task } from './entities/task.entity';
import { Environment } from './entities/environment.entity';
import { Repository as ProjectRepository } from './entities/repository.entity';
import { CloudService } from './entities/cloud-service.entity';
import { UsefulLink } from './entities/useful-link.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  technologiesSeed,
  projectSeed,
  repositoriesSeed,
  environmentsSeed,
  teamMembersSeed,
  tasksSeed,
  cloudServicesSeed,
  usefulLinksSeed
} from './seeds/project-seed';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Technology)
    private readonly technologyRepository: Repository<Technology>,
    @InjectRepository(TeamMember)
    private readonly teamMemberRepository: Repository<TeamMember>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Environment)
    private readonly environmentRepository: Repository<Environment>,
    @InjectRepository(ProjectRepository)
    private readonly projectRepositoryEntity: Repository<ProjectRepository>,
    @InjectRepository(CloudService)
    private readonly cloudServiceRepository: Repository<CloudService>,
    @InjectRepository(UsefulLink)
    private readonly usefulLinkRepository: Repository<UsefulLink>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    // Extraer solo los campos básicos del proyecto
    const { 
      repositories, 
      environments, 
      teamMembers, 
      tasks, 
      technologyIds, 
      cloudServices, 
      usefulLinks, 
      ...projectData 
    } = createProjectDto;
    
    // Crear el proyecto básico
    const project = this.projectRepository.create(projectData);
    const savedProject = await this.projectRepository.save(project);

    // Retornar el proyecto creado (sin relaciones por ahora)
    return savedProject;
  }

  async findAll(): Promise<Project[]> {
    return await this.projectRepository.find({
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
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
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

    if (!project) {
      throw new NotFoundException(`Proyecto con ID ${id} no encontrado`);
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    
    // Actualizar solo los campos básicos del proyecto
    const { 
      repositories, 
      environments, 
      teamMembers, 
      tasks, 
      technologyIds, 
      cloudServices, 
      usefulLinks, 
      ...projectData 
    } = updateProjectDto;
    
    Object.assign(project, projectData);
    
    return await this.projectRepository.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    await this.projectRepository.remove(project);
  }

  async findByStatus(status: ProjectStatus): Promise<Project[]> {
    return await this.projectRepository.find({
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
  }

  async findByBusinessUnit(businessUnit: string): Promise<Project[]> {
    return await this.projectRepository.find({
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
  }

  async getProjectStats(): Promise<any> {
    const totalProjects = await this.projectRepository.count();
    const projectsByStatus = await this.projectRepository
      .createQueryBuilder('project')
      .select('project.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('project.status')
      .getRawMany();

    const projectsByPriority = await this.projectRepository
      .createQueryBuilder('project')
      .select('project.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('project.priority')
      .getRawMany();

    return {
      totalProjects,
      byStatus: projectsByStatus,
      byPriority: projectsByPriority
    };
  }

  async runSeed(): Promise<any> {
    try {
      console.log('🌱 Iniciando seed de datos...');

      // 1. Crear tecnologías
      console.log('📦 Creando tecnologías...');
      const technologies = await Promise.all(
        technologiesSeed.map(tech => this.technologyRepository.save(tech))
      );

      // 2. Crear proyecto principal
      console.log('🏗️  Creando proyecto principal...');
      const project = await this.projectRepository.save(projectSeed);

      // 3. Crear repositorios
      console.log('📚 Creando repositorios...');
      const repositories = await Promise.all(
        repositoriesSeed.map(repo => 
          this.projectRepositoryEntity.save({ ...repo, project })
        )
      );

      // 4. Crear entornos
      console.log('🌍 Creando entornos...');
      const environments = await Promise.all(
        environmentsSeed.map(env => 
          this.environmentRepository.save({ ...env, project })
        )
      );

      // 5. Crear miembros del equipo
      console.log('👥 Creando miembros del equipo...');
      const teamMembers = await Promise.all(
        teamMembersSeed.map(member => 
          this.teamMemberRepository.save({ ...member, project })
        )
      );

      // 6. Crear tareas
      console.log('📋 Creando tareas...');
      const tasks = await Promise.all(
        tasksSeed.map(task => 
          this.taskRepository.save({ ...task, project })
        )
      );

      // 7. Crear servicios cloud
      console.log('☁️  Creando servicios cloud...');
      const cloudServices = await Promise.all(
        cloudServicesSeed.map(service => 
          this.cloudServiceRepository.save({ ...service, project })
        )
      );

      // 8. Crear enlaces útiles
      console.log('🔗 Creando enlaces útiles...');
      const usefulLinks = await Promise.all(
        usefulLinksSeed.map(link => 
          this.usefulLinkRepository.save({ ...link, project })
        )
      );

      // 9. Asignar tecnologías al proyecto
      console.log('🔧 Asignando tecnologías al proyecto...');
      project.technologies = technologies;
      await this.projectRepository.save(project);

      console.log('✅ Seed completado exitosamente!');
      
      return {
        message: 'Seed ejecutado correctamente',
        data: {
          project: project.id,
          technologies: technologies.length,
          repositories: repositories.length,
          environments: environments.length,
          teamMembers: teamMembers.length,
          tasks: tasks.length,
          cloudServices: cloudServices.length,
          usefulLinks: usefulLinks.length
        }
      };
    } catch (error) {
      console.error('❌ Error ejecutando seed:', error);
      throw error;
    }
  }
} 