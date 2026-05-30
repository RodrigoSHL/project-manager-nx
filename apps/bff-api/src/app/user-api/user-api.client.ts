import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';

interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  avatarUrl?: string;
}

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

  async createUser(dto: CreateUserRequest): Promise<UserApiUser> {
    const response = await this.fetchUserApi('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      throw new Error(`User API create user failed with status ${response.status}`);
    }

    return response.json() as Promise<UserApiUser>;
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
