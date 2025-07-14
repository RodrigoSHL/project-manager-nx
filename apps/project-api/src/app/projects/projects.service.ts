import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Project, ProjectStatus } from './entities/project.entity';
import { Technology } from './entities/technology.entity';
import { TeamMember } from './entities/team-member.entity';
import { Task } from './entities/task.entity';
import { Environment } from './entities/environment.entity';
import { Repository as ProjectRepository } from './entities/repository.entity';
import { CloudService } from './entities/cloud-service.entity';
import { UsefulLink } from './entities/useful-link.entity';
import { File } from '../files/entities/file.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto, GranularUpdateProjectDto } from './dto/update-project.dto';
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
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
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
    const projects = await this.projectRepository.find({
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

    // Agregar archivos a cada proyecto
    for (const project of projects) {
      const files = await this.fileRepository.find({
        where: { projectId: project.id },
        select: ['id', 'filename', 'mimetype', 'size', 'type', 'description', 'uploadedAt', 'projectId'],
        order: { uploadedAt: 'DESC' }
      });
      (project as any).files = files;
    }

    return projects;
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

    // Agregar archivos al proyecto
    const files = await this.fileRepository.find({
      where: { projectId: project.id },
      select: ['id', 'filename', 'mimetype', 'size', 'type', 'description', 'uploadedAt', 'projectId'],
      order: { uploadedAt: 'DESC' }
    });
    (project as any).files = files;

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    
    // Extraer los campos de relaciones y los campos básicos del proyecto
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
    
    // Actualizar campos básicos del proyecto
    Object.assign(project, projectData);
    
    // Guardar el proyecto primero
    const savedProject = await this.projectRepository.save(project);

    // Procesar repositorios si se proporcionan
    if (repositories && repositories.length > 0) {
      // Eliminar repositorios existentes
      await this.projectRepositoryEntity.delete({ projectId: id });
      // Crear nuevos repositorios
      for (const repo of repositories) {
        const newRepo = Object.assign(this.projectRepositoryEntity.create(), repo);
        newRepo.projectId = id;
        await this.projectRepositoryEntity.save(newRepo);
      }
    }

    // Procesar entornos si se proporcionan
    if (environments && environments.length > 0) {
      // Eliminar entornos existentes
      await this.environmentRepository.delete({ projectId: id });
      // Crear nuevos entornos
      for (const env of environments) {
        const newEnv = Object.assign(this.environmentRepository.create(), env);
        newEnv.projectId = id;
        await this.environmentRepository.save(newEnv);
      }
    }

    // Procesar miembros del equipo si se proporcionan
    if (teamMembers && teamMembers.length > 0) {
      // Eliminar miembros existentes
      await this.teamMemberRepository.delete({ projectId: id });
      // Crear nuevos miembros
      for (const member of teamMembers) {
        const newMember = Object.assign(this.teamMemberRepository.create(), member);
        newMember.projectId = id;
        await this.teamMemberRepository.save(newMember);
      }
    }

    // Procesar tareas si se proporcionan
    if (tasks && tasks.length > 0) {
      // Eliminar tareas existentes
      await this.taskRepository.delete({ projectId: id });
      // Crear nuevas tareas
      for (const task of tasks) {
        const newTask = Object.assign(this.taskRepository.create(), task);
        newTask.projectId = id;
        await this.taskRepository.save(newTask);
      }
    }

    // Procesar servicios cloud si se proporcionan
    if (cloudServices && cloudServices.length > 0) {
      // Eliminar servicios existentes
      await this.cloudServiceRepository.delete({ projectId: id });
      // Crear nuevos servicios
      for (const service of cloudServices) {
        const newService = Object.assign(this.cloudServiceRepository.create(), service);
        newService.projectId = id;
        await this.cloudServiceRepository.save(newService);
      }
    }

    // Procesar enlaces útiles si se proporcionan
    if (usefulLinks && usefulLinks.length > 0) {
      // Eliminar enlaces existentes
      await this.usefulLinkRepository.delete({ projectId: id });
      // Crear nuevos enlaces
      for (const link of usefulLinks) {
        const newLink = Object.assign(this.usefulLinkRepository.create(), link);
        newLink.projectId = id;
        await this.usefulLinkRepository.save(newLink);
      }
    }

    // Procesar tecnologías si se proporcionan
    if (technologyIds !== undefined) {
      if (technologyIds.length > 0) {
        const technologies = await this.technologyRepository.findBy({ id: In(technologyIds) });
        savedProject.technologies = technologies;
      } else {
        // Si se envía un array vacío, eliminar todas las tecnologías
        savedProject.technologies = [];
      }
      await this.projectRepository.save(savedProject);
    }
    
    // Retornar el proyecto actualizado con todas las relaciones
    return await this.findOne(id);
  }

  async granularUpdate(id: string, granularUpdateDto: GranularUpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    
    // Actualizar campos básicos del proyecto
    const { 
      repositories, 
      environments, 
      teamMembers, 
      tasks, 
      technologyIds, 
      cloudServices, 
      usefulLinks, 
      ...projectData 
    } = granularUpdateDto;
    
    Object.assign(project, projectData);
    const savedProject = await this.projectRepository.save(project);

    // Procesar repositorios de forma granular
    if (repositories) {
      if (repositories.add && repositories.add.length > 0) {
        for (const repo of repositories.add) {
          const newRepo = Object.assign(this.projectRepositoryEntity.create(), repo);
          newRepo.projectId = id;
          await this.projectRepositoryEntity.save(newRepo);
        }
      }
      
      if (repositories.update && repositories.update.length > 0) {
        for (const update of repositories.update) {
          await this.projectRepositoryEntity.update(update.id, update as any);
        }
      }
      
      if (repositories.delete && repositories.delete.length > 0) {
        await this.projectRepositoryEntity.delete(repositories.delete);
      }
    }

    // Procesar entornos de forma granular
    if (environments) {
      if (environments.add && environments.add.length > 0) {
        for (const env of environments.add) {
          const newEnv = Object.assign(this.environmentRepository.create(), env);
          newEnv.projectId = id;
          await this.environmentRepository.save(newEnv);
        }
      }
      
      if (environments.update && environments.update.length > 0) {
        for (const update of environments.update) {
          await this.environmentRepository.update(update.id, update as any);
        }
      }
      
      if (environments.delete && environments.delete.length > 0) {
        await this.environmentRepository.delete(environments.delete);
      }
    }

    // Procesar miembros del equipo de forma granular
    if (teamMembers) {
      if (teamMembers.add && teamMembers.add.length > 0) {
        for (const member of teamMembers.add) {
          const newMember = Object.assign(this.teamMemberRepository.create(), member);
          newMember.projectId = id;
          await this.teamMemberRepository.save(newMember);
        }
      }
      
      if (teamMembers.update && teamMembers.update.length > 0) {
        for (const update of teamMembers.update) {
          await this.teamMemberRepository.update(update.id, update as any);
        }
      }
      
      if (teamMembers.delete && teamMembers.delete.length > 0) {
        await this.teamMemberRepository.delete(teamMembers.delete);
      }
    }

    // Procesar tareas de forma granular
    if (tasks) {
      if (tasks.add && tasks.add.length > 0) {
        for (const task of tasks.add) {
          const newTask = Object.assign(this.taskRepository.create(), task);
          newTask.projectId = id;
          await this.taskRepository.save(newTask);
        }
      }
      
      if (tasks.update && tasks.update.length > 0) {
        for (const update of tasks.update) {
          await this.taskRepository.update(update.id, update as any);
        }
      }
      
      if (tasks.delete && tasks.delete.length > 0) {
        await this.taskRepository.delete(tasks.delete);
      }
    }

    // Procesar servicios cloud de forma granular
    if (cloudServices) {
      if (cloudServices.add && cloudServices.add.length > 0) {
        for (const service of cloudServices.add) {
          const newService = Object.assign(this.cloudServiceRepository.create(), service);
          newService.projectId = id;
          await this.cloudServiceRepository.save(newService);
        }
      }
      
      if (cloudServices.update && cloudServices.update.length > 0) {
        for (const update of cloudServices.update) {
          await this.cloudServiceRepository.update(update.id, update as any);
        }
      }
      
      if (cloudServices.delete && cloudServices.delete.length > 0) {
        await this.cloudServiceRepository.delete(cloudServices.delete);
      }
    }

    // Procesar enlaces útiles de forma granular
    if (usefulLinks) {
      if (usefulLinks.add && usefulLinks.add.length > 0) {
        for (const link of usefulLinks.add) {
          const newLink = Object.assign(this.usefulLinkRepository.create(), link);
          newLink.projectId = id;
          await this.usefulLinkRepository.save(newLink);
        }
      }
      
      if (usefulLinks.update && usefulLinks.update.length > 0) {
        for (const update of usefulLinks.update) {
          await this.usefulLinkRepository.update(update.id, update as any);
        }
      }
      
      if (usefulLinks.delete && usefulLinks.delete.length > 0) {
        await this.usefulLinkRepository.delete(usefulLinks.delete);
      }
    }

    // Procesar tecnologías si se proporcionan
    if (technologyIds !== undefined) {
      if (technologyIds.length > 0) {
        const technologies = await this.technologyRepository.findBy({ id: In(technologyIds) });
        savedProject.technologies = technologies;
      } else {
        // Si se envía un array vacío, eliminar todas las tecnologías
        savedProject.technologies = [];
      }
      await this.projectRepository.save(savedProject);
    }
    
    // Retornar el proyecto actualizado con todas las relaciones
    return await this.findOne(id);
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

  async findAllTechnologies(): Promise<Technology[]> {
    return await this.technologyRepository.find({
      where: { isActive: true },
      order: {
        name: 'ASC'
      }
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