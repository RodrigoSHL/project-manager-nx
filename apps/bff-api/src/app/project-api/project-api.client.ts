import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectApiClient {
  private readonly baseUrl = this.resolveBaseUrl();

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
