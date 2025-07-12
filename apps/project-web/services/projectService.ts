import { Project, ProjectStats } from '@/types/project';

const API_BASE_URL = 'http://localhost:3000/api';

export class ProjectService {
  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  static async getAllProjects(): Promise<Project[]> {
    const response = await fetch(`${API_BASE_URL}/projects`);
    return this.handleResponse<Project[]>(response);
  }

  static async getProjectById(id: string): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`);
    return this.handleResponse<Project>(response);
  }

  static async getProjectStats(): Promise<ProjectStats> {
    const response = await fetch(`${API_BASE_URL}/projects/stats`);
    return this.handleResponse<ProjectStats>(response);
  }

  static async getProjectsByStatus(status: string): Promise<Project[]> {
    const response = await fetch(`${API_BASE_URL}/projects/status/${status}`);
    return this.handleResponse<Project[]>(response);
  }

  static async getProjectsByBusinessUnit(businessUnit: string): Promise<Project[]> {
    const response = await fetch(`${API_BASE_URL}/projects/business-unit/${businessUnit}`);
    return this.handleResponse<Project[]>(response);
  }

  static async createProject(projectData: Partial<Project>): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });
    return this.handleResponse<Project>(response);
  }

  static async updateProject(id: string, projectData: Partial<Project>): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });
    return this.handleResponse<Project>(response);
  }

  static async deleteProject(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  static async runSeed(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/projects/seed`, {
      method: 'POST',
    });
    return this.handleResponse(response);
  }

  static async getAllTechnologies(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/projects/technologies`);
    return this.handleResponse<any[]>(response);
  }

  static async granularUpdateProject(id: string, updateData: any): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects/${id}/granular`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    return this.handleResponse<Project>(response);
  }
} 