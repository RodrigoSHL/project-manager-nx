import { HttpException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type JsonBody = Record<string, unknown>;

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export interface UserApiUser {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
}

@Injectable()
export class UserApiClient {
  private readonly baseUrl = this.resolveBaseUrl();

  async createUser(dto: CreateUserDto): Promise<UserApiUser> {
    const response = await this.fetchUserApi('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });

    return this.userResponse(response, 'User API create user failed');
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<UserApiUser> {
    const response = await this.fetchUserApi(`/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });

    return this.userResponse(response, 'User API update user failed');
  }

  async removeUser(id: string): Promise<void> {
    const response = await this.fetchUserApi(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!response.ok) await this.throwUpstream(response, 'User API delete user failed');
  }

  async validateCredentials(email: string, password: string): Promise<UserApiUser> {
    const response = await this.fetchUserApi('/users/internal/auth/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.status === 401) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!response.ok) {
      throw new Error(`User API auth validation failed with status ${response.status}`);
    }

    return response.json() as Promise<UserApiUser>;
  }

  async findAllUsers() {
    return this.get('/users');
  }

  async findOneUser(id: string) {
    return this.get(`/users/${encodeURIComponent(id)}`);
  }

  async createWorkspace(dto: JsonBody) {
    return this.write('/workspaces', 'POST', dto);
  }

  async findAllWorkspaces() {
    return this.get('/workspaces');
  }

  async findWorkspaceBySlug(slug: string) {
    return this.get(`/workspaces/slug/${encodeURIComponent(slug)}`);
  }

  async findOneWorkspace(id: string) {
    return this.get(`/workspaces/${encodeURIComponent(id)}`);
  }

  async updateWorkspace(id: string, dto: JsonBody) {
    return this.write(`/workspaces/${encodeURIComponent(id)}`, 'PATCH', dto);
  }

  async removeWorkspace(id: string) {
    return this.remove(`/workspaces/${encodeURIComponent(id)}`);
  }

  async addWorkspaceMember(workspaceId: string, dto: JsonBody) {
    return this.write(`/workspaces/${encodeURIComponent(workspaceId)}/members`, 'POST', dto);
  }

  async findWorkspaceMembers(workspaceId: string) {
    return this.get(`/workspaces/${encodeURIComponent(workspaceId)}/members`);
  }

  async updateWorkspaceMemberRole(workspaceId: string, userId: string, dto: JsonBody) {
    return this.write(
      `/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(userId)}/role`,
      'PATCH',
      dto,
    );
  }

  async removeWorkspaceMember(workspaceId: string, userId: string) {
    return this.remove(`/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(userId)}`);
  }

  private async get(path: string) {
    const response = await this.fetchUserApi(path, { method: 'GET' });

    if (!response.ok) {
      throw new Error(`User API request failed with status ${response.status}`);
    }

    return response.json();
  }

  private async write(path: string, method: 'POST' | 'PATCH', body: JsonBody) {
    const response = await this.fetchUserApi(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`User API write failed with status ${response.status}`);
    }

    return response.json();
  }

  private async remove(path: string) {
    const response = await this.fetchUserApi(path, { method: 'DELETE' });

    if (!response.ok) {
      throw new Error(`User API delete failed with status ${response.status}`);
    }
  }

  private async userResponse(response: Response, fallback: string): Promise<UserApiUser> {
    if (!response.ok) await this.throwUpstream(response, fallback);
    return response.json() as Promise<UserApiUser>;
  }

  private async throwUpstream(response: Response, fallback: string): Promise<never> {
    const body = await response.json().catch(() => ({ message: fallback }));
    throw new HttpException(body, response.status >= 400 && response.status < 500 ? response.status : 502);
  }

  private async fetchUserApi(path: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(`${this.baseUrl}${path}`, init);
    } catch {
      throw new ServiceUnavailableException('User API is unavailable');
    }
  }

  private resolveBaseUrl(): string {
    const configuredUrl = process.env.USER_API_URL || 'http://localhost:3001/api';
    const normalizedUrl = configuredUrl.replace(/\/$/, '');

    return normalizedUrl.endsWith('/api') ? normalizedUrl : `${normalizedUrl}/api`;
  }
}
