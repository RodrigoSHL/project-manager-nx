import { HttpException, Injectable, ServiceUnavailableException } from '@nestjs/common';
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

  async forwardJsonRequest(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', path: string, body?: ProjectBody) {
    const response = await this.fetchProjectApi(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Project API request failed with status ${response.status}`);
    }

    if (response.status === 204 || method === 'DELETE') {
      return undefined;
    }

    return response.json();
  }

  async findOne(id: string) {
    return this.get(`/projects/${encodeURIComponent(id)}`);
  }

  async findTicketComments(projectId: string, ticketId: string) {
    return this.commentRequest('GET', this.commentPath(projectId, ticketId));
  }

  async findTicket(projectId: string, ticketId: string) {
    const response = await this.fetchProjectApi(
      `/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}`,
      { method: 'GET' },
    );

    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: 'Project API ticket request failed' }));
      throw new HttpException(body, response.status);
    }

    return response.json();
  }

  async createTicketComment(projectId: string, ticketId: string, body: string, user: AuthenticatedUser) {
    return this.commentRequest('POST', this.commentPath(projectId, ticketId), {
      body,
      authorId: user.userId,
    });
  }

  async updateTicketComment(
    projectId: string,
    ticketId: string,
    commentId: string,
    body: string,
    user: AuthenticatedUser,
  ) {
    const requester = `requesterId=${encodeURIComponent(user.userId)}`;
    return this.commentRequest(
      'PATCH',
      `${this.commentPath(projectId, ticketId)}/${encodeURIComponent(commentId)}?${requester}`,
      { body },
    );
  }

  async deleteTicketComment(
    projectId: string,
    ticketId: string,
    commentId: string,
    user: AuthenticatedUser,
  ) {
    const requester = `requesterId=${encodeURIComponent(user.userId)}`;
    return this.commentRequest(
      'DELETE',
      `${this.commentPath(projectId, ticketId)}/${encodeURIComponent(commentId)}?${requester}`,
    );
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

  private commentPath(projectId: string, ticketId: string): string {
    return `/projects/${encodeURIComponent(projectId)}/tickets/${encodeURIComponent(ticketId)}/comments`;
  }

  private async commentRequest(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body?: ProjectBody,
  ) {
    const response = await this.fetchProjectApi(path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const message = await response.text().catch(() => 'Project API comment request failed');
      throw new HttpException(message || 'Project API comment request failed', response.status);
    }

    if (method === 'DELETE' || response.status === 204) return undefined;
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
