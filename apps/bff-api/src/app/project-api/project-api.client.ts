import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CreateProjectDto } from './dto/create-project.dto';

type ProjectBody = Record<string, unknown>;

@Injectable()
export class ProjectApiClient {
  private readonly baseUrl = this.resolveBaseUrl();

  async findAll(workspaceId?: string) {
    const query = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : '';
    return this.get(`/projects${query}`);
  }

  async getProjectStats() {
    return this.get('/projects/stats');
  }

  async findByStatus(status: string) {
    return this.get(`/projects/status/${encodeURIComponent(status)}`);
  }

  async findByBusinessUnit(businessUnit: string) {
    return this.get(`/projects/business-unit/${encodeURIComponent(businessUnit)}`);
  }

  async findAllTechnologies() {
    return this.get('/projects/technologies');
  }

  async findOne(id: string) {
    return this.get(`/projects/${encodeURIComponent(id)}`);
  }

  async createProject(dto: CreateProjectDto, user: AuthenticatedUser) {
    const response = await this.fetchProjectApi('/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.userId,
        'x-user-email': user.email,
        'x-user-roles': user.roles.join(','),
      },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      throw new Error(`Project API create project failed with status ${response.status}`);
    }

    return response.json();
  }

  async updateProject(id: string, dto: ProjectBody, user: AuthenticatedUser) {
    const response = await this.fetchProjectApi(`/projects/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: this.authenticatedJsonHeaders(user),
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      throw new Error(`Project API update project failed with status ${response.status}`);
    }

    return response.json();
  }

  async granularUpdateProject(id: string, dto: ProjectBody, user: AuthenticatedUser) {
    const response = await this.fetchProjectApi(`/projects/${encodeURIComponent(id)}/granular`, {
      method: 'PATCH',
      headers: this.authenticatedJsonHeaders(user),
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      throw new Error(`Project API granular update failed with status ${response.status}`);
    }

    return response.json();
  }

  async deleteProject(id: string, user: AuthenticatedUser) {
    const response = await this.fetchProjectApi(`/projects/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.authenticatedHeaders(user),
    });

    if (!response.ok) {
      throw new Error(`Project API delete project failed with status ${response.status}`);
    }
  }

  async runSeed(user: AuthenticatedUser) {
    const response = await this.fetchProjectApi('/projects/seed', {
      method: 'POST',
      headers: this.authenticatedHeaders(user),
    });

    if (!response.ok) {
      throw new Error(`Project API seed failed with status ${response.status}`);
    }

    return response.json();
  }

  private async get(path: string) {
    const response = await this.fetchProjectApi(path, { method: 'GET' });

    if (!response.ok) {
      throw new Error(`Project API request failed with status ${response.status}`);
    }

    return response.json();
  }

  private authenticatedJsonHeaders(user: AuthenticatedUser): Record<string, string> {
    return {
      ...this.authenticatedHeaders(user),
      'Content-Type': 'application/json',
    };
  }

  private authenticatedHeaders(user: AuthenticatedUser): Record<string, string> {
    return {
      'x-user-id': user.userId,
      'x-user-email': user.email,
      'x-user-roles': user.roles.join(','),
    };
  }

  private async fetchProjectApi(path: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(`${this.baseUrl}${path}`, init);
    } catch {
      throw new ServiceUnavailableException('Project API is unavailable');
    }
  }

  private resolveBaseUrl(): string {
    const configuredUrl = process.env.PROJECT_API_URL || 'http://localhost:3002/api';
    const normalizedUrl = configuredUrl.replace(/\/$/, '');

    return normalizedUrl.endsWith('/api') ? normalizedUrl : `${normalizedUrl}/api`;
  }
}
