export enum ProjectStatus {
  PLANNING = 'planning',
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  STAGING = 'staging',
  PRODUCTION = 'production',
  MAINTENANCE = 'maintenance',
  DEPRECATED = 'deprecated'
}

export enum ProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface Repository {
  id: string;
  name: string;
  url: string;
  type: string;
  branch: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Environment {
  id: string;
  name: string;
  url: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Technology {
  id: string;
  name: string;
  version?: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CloudService {
  id: string;
  name: string;
  provider: string;
  service: string;
  region: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsefulLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  shortName: string;
  businessUnit: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  version?: string;
  startDate?: Date;
  endDate?: Date;
  mainBranch?: string;
  lastDeployment?: string;
  lastDeploymentDate?: Date;
  authenticationType?: string;
  accessInstructions?: string;
  architectureDiagram?: string;
  createdAt: Date;
  updatedAt: Date;
  repositories: Repository[];
  environments: Environment[];
  teamMembers: TeamMember[];
  tasks: Task[];
  technologies: Technology[];
  cloudServices: CloudService[];
  usefulLinks: UsefulLink[];
}

export interface ProjectStats {
  total: number;
  byStatus: Record<ProjectStatus, number>;
  byPriority: Record<ProjectPriority, number>;
  byBusinessUnit: Record<string, number>;
} 