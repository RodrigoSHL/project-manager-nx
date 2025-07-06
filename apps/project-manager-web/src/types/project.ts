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

export interface Technology {
  id: string;
  name: string;
  category: string;
  version?: string;
  description?: string;
}

export interface Repository {
  id: string;
  name: string;
  url: string;
  type: string;
  isMain: boolean;
  branch: string;
  lastCommit?: string;
  lastCommitDate?: Date;
}

export interface Environment {
  id: string;
  name: string;
  url: string;
  type: string;
  description?: string;
  isActive: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  isActive: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: Date;
  assignedTo?: string;
}

export interface CloudService {
  id: string;
  name: string;
  provider: string;
  service: string;
  region?: string;
  description?: string;
  isActive: boolean;
}

export interface UsefulLink {
  id: string;
  title: string;
  url: string;
  category?: string;
  description?: string;
}

export interface Project {
  id: string;
  name: string;
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
  
  // Relaciones
  repositories: Repository[];
  environments: Environment[];
  teamMembers: TeamMember[];
  tasks: Task[];
  technologies: Technology[];
  cloudServices: CloudService[];
  usefulLinks: UsefulLink[];
}

export interface ProjectStats {
  totalProjects: number;
  byStatus: Array<{ status: string; count: number }>;
  byPriority: Array<{ priority: string; count: number }>;
} 