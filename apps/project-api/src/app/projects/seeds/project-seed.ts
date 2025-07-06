import { Project, ProjectStatus, ProjectPriority } from '../entities/project.entity';
import { Technology, TechnologyCategory } from '../entities/technology.entity';
import { TeamMember, TeamRole } from '../entities/team-member.entity';
import { Task, TaskStatus, TaskPriority } from '../entities/task.entity';
import { Environment, EnvironmentType } from '../entities/environment.entity';
import { Repository } from '../entities/repository.entity';
import { CloudService, CloudProvider } from '../entities/cloud-service.entity';
import { UsefulLink, LinkType } from '../entities/useful-link.entity';

export const technologiesSeed: Partial<Technology>[] = [
  {
    name: 'React',
    version: '18.2.0',
    category: TechnologyCategory.FRONTEND,
    description: 'Biblioteca de JavaScript para construir interfaces de usuario',
    website: 'https://reactjs.org/',
    documentation: 'https://reactjs.org/docs/'
  },
  {
    name: 'Next.js',
    version: '14.0.0',
    category: TechnologyCategory.FRAMEWORK,
    description: 'Framework de React para aplicaciones web',
    website: 'https://nextjs.org/',
    documentation: 'https://nextjs.org/docs'
  },
  {
    name: 'TypeScript',
    version: '5.0.0',
    category: TechnologyCategory.TOOL,
    description: 'Superset de JavaScript con tipado estático',
    website: 'https://www.typescriptlang.org/',
    documentation: 'https://www.typescriptlang.org/docs/'
  },
  {
    name: 'PostgreSQL',
    version: '15.0',
    category: TechnologyCategory.DATABASE,
    description: 'Sistema de gestión de bases de datos relacional',
    website: 'https://www.postgresql.org/',
    documentation: 'https://www.postgresql.org/docs/'
  },
  {
    name: 'Docker',
    version: '24.0.0',
    category: TechnologyCategory.INFRASTRUCTURE,
    description: 'Plataforma para desarrollar, enviar y ejecutar aplicaciones en contenedores',
    website: 'https://www.docker.com/',
    documentation: 'https://docs.docker.com/'
  },
  {
    name: 'AWS',
    version: 'latest',
    category: TechnologyCategory.INFRASTRUCTURE,
    description: 'Servicios de computación en la nube de Amazon',
    website: 'https://aws.amazon.com/',
    documentation: 'https://docs.aws.amazon.com/'
  }
];

export const projectSeed: Partial<Project> = {
  name: 'Sistema de Gestión Empresarial',
  businessUnit: 'Tecnología e Innovación',
  description: 'Plataforma integral para la gestión de recursos empresariales con módulos de facturación, inventario y reportes analíticos en tiempo real.',
  status: ProjectStatus.PRODUCTION,
  priority: ProjectPriority.HIGH,
  version: 'v2.1.3',
  startDate: new Date('2023-01-15'),
  mainBranch: 'main',
  lastDeployment: 'v2.1.3',
  lastDeploymentDate: new Date('2024-01-15'),
  authenticationType: 'SSO (Single Sign-On)',
  accessInstructions: 'Para solicitar accesos: Contactar al equipo de IT mediante ticket en ServiceNow'
};

export const repositoriesSeed: Partial<Repository>[] = [
  {
    name: 'empresa/sistema-gestion',
    url: 'https://github.com/empresa/sistema-gestion',
    description: 'Repositorio principal',
    mainBranch: 'main',
    lastVersion: 'v2.1.3',
    lastCommitDate: new Date('2024-01-15'),
    isActive: true
  }
];

export const environmentsSeed: Partial<Environment>[] = [
  {
    type: EnvironmentType.LOCAL,
    url: 'localhost:3000',
    description: 'Desarrollo local',
    isActive: true
  },
  {
    type: EnvironmentType.STAGING,
    url: 'staging.empresa.com',
    description: 'Pruebas y QA',
    isActive: true
  },
  {
    type: EnvironmentType.PRODUCTION,
    url: 'app.empresa.com',
    description: 'Entorno productivo',
    isActive: true
  }
];

export const teamMembersSeed: Partial<TeamMember>[] = [
  {
    name: 'Ana García',
    email: 'ana.garcia@empresa.com',
    role: TeamRole.TECH_LEAD,
    isActive: true,
    startDate: new Date('2023-01-15')
  },
  {
    name: 'Carlos Ruiz',
    email: 'carlos.ruiz@empresa.com',
    role: TeamRole.DEVOPS,
    isActive: true,
    startDate: new Date('2023-02-01')
  },
  {
    name: 'María López',
    email: 'maria.lopez@empresa.com',
    role: TeamRole.PRODUCT_OWNER,
    isActive: true,
    startDate: new Date('2023-01-15')
  }
];

export const tasksSeed: Partial<Task>[] = [
  {
    title: 'Migración a AWS EKS',
    description: 'Migrar la aplicación a Kubernetes en AWS EKS',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    dueDate: new Date('2024-03-15'),
    category: 'Infraestructura'
  },
  {
    title: 'Implementar autenticación 2FA',
    description: 'Agregar autenticación de dos factores',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    dueDate: new Date('2024-03-30'),
    category: 'Seguridad'
  },
  {
    title: 'Optimización de consultas DB',
    description: 'Optimizar consultas de base de datos para mejorar rendimiento',
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    dueDate: new Date('2024-04-10'),
    category: 'Performance'
  }
];

export const cloudServicesSeed: Partial<CloudService>[] = [
  {
    name: 'AWS EKS',
    provider: CloudProvider.AWS,
    serviceType: 'Orquestación de contenedores',
    description: 'Servicio de Kubernetes gestionado',
    isActive: true
  },
  {
    name: 'AWS S3',
    provider: CloudProvider.AWS,
    serviceType: 'Almacenamiento de archivos',
    description: 'Almacenamiento de objetos escalable',
    isActive: true
  },
  {
    name: 'AWS RDS',
    provider: CloudProvider.AWS,
    serviceType: 'Base de datos PostgreSQL',
    description: 'Servicio de base de datos relacional gestionado',
    isActive: true
  }
];

export const usefulLinksSeed: Partial<UsefulLink>[] = [
  {
    title: 'Diseños en Figma',
    url: 'https://figma.com/file/project-designs',
    type: LinkType.DESIGN,
    description: 'Diseños y prototipos del proyecto',
    icon: 'figma',
    order: 1
  },
  {
    title: 'Confluence - Wiki del Proyecto',
    url: 'https://confluence.empresa.com/project-wiki',
    type: LinkType.DOCUMENTATION,
    description: 'Documentación técnica y procedimientos',
    icon: 'file-text',
    order: 2
  },
  {
    title: 'Canal de Soporte - Slack',
    url: 'https://slack.com/app/project-support',
    type: LinkType.COMMUNICATION,
    description: 'Canal de comunicación y soporte',
    icon: 'message-square',
    order: 3
  },
  {
    title: 'Monitoreo - Grafana',
    url: 'https://grafana.empresa.com/project-dashboard',
    type: LinkType.MONITORING,
    description: 'Dashboard de monitoreo y métricas',
    icon: 'database',
    order: 4
  }
]; 