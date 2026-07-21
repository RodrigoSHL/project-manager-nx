import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

@Injectable()
export class UserApiClient {
  private readonly baseUrl = this.resolveBaseUrl();

  async findByEmail(email: string): Promise<UserSummary> {
    let response: Response;

    try {
      response = await fetch(
        `${this.baseUrl}/users/internal/lookup?email=${encodeURIComponent(
          email
        )}`
      );
    } catch {
      throw new ServiceUnavailableException('User API is unavailable');
    }

    if (response.status === 404) {
      throw new NotFoundException('No registered user has that email');
    }
    if (!response.ok) {
      throw new BadGatewayException('User API lookup failed');
    }

    return response.json() as Promise<UserSummary>;
  }

  private resolveBaseUrl(): string {
    const configuredUrl =
      process.env.USER_API_URL || 'http://localhost:3001/api';
    const normalizedUrl = configuredUrl.replace(/\/$/, '');
    return normalizedUrl.endsWith('/api')
      ? normalizedUrl
      : `${normalizedUrl}/api`;
  }
}
