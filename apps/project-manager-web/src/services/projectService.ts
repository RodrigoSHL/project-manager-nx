import { Project, ProjectStats, ProjectStatus } from '@/types/project';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

class ProjectService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}/projects${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Obtener todos los proyectos
  async getAllProjects(): Promise<Project[]> {
    return this.request<Project[]>('');
  }

  // Obtener un proyecto por ID
  async getProjectById(id: string): Promise<Project> {
    return this.request<Project>(`/${id}`);
  }

  // Obtener estadísticas de proyectos
  async getProjectStats(): Promise<ProjectStats> {
    return this.request<ProjectStats>('/stats');
  }

  // Obtener proyectos por estado
  async getProjectsByStatus(status: ProjectStatus): Promise<Project[]> {
    return this.request<Project[]>(`/status/${status}`);
  }

  // Obtener proyectos por unidad de negocio
  async getProjectsByBusinessUnit(businessUnit: string): Promise<Project[]> {
    return this.request<Project[]>(`/business-unit/${businessUnit}`);
  }

  // Crear un nuevo proyecto
  async createProject(projectData: Partial<Project>): Promise<Project> {
    return this.request<Project>('', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  // Actualizar un proyecto
  async updateProject(id: string, projectData: Partial<Project>): Promise<Project> {
    return this.request<Project>(`/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(projectData),
    });
  }

  // Eliminar un proyecto
  async deleteProject(id: string): Promise<void> {
    return this.request<void>(`/${id}`, {
      method: 'DELETE',
    });
  }

  // Ejecutar seed de datos (para desarrollo)
  async runSeed(): Promise<any> {
    return this.request<any>('/seed', {
      method: 'POST',
    });
  }
}

export const projectService = new ProjectService(); 