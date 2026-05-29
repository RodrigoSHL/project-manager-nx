import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Record<string, unknown>;
}

@Injectable()
export class BffAuthService {
  private readonly userApiUrl =
    process.env.USER_API_URL || 'http://localhost:3002';

  async login(dto: LoginDto): Promise<AuthTokens> {
    const res = await fetch(`${this.userApiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { message?: string };
      if (res.status === 401) throw new UnauthorizedException(body.message ?? 'Invalid credentials');
      throw new InternalServerErrorException(body.message ?? 'Auth service error');
    }

    return res.json() as Promise<AuthTokens>;
  }

  async register(body: unknown): Promise<unknown> {
    const res = await fetch(`${this.userApiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new InternalServerErrorException(err);
    }

    return res.json();
  }

  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    const res = await fetch(`${this.userApiUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rawRefreshToken }),
    });

    if (res.status === 401) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (!res.ok) {
      throw new InternalServerErrorException('Auth service error');
    }

    return res.json() as Promise<AuthTokens>;
  }

  async logout(rawRefreshToken: string): Promise<void> {
    await fetch(`${this.userApiUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rawRefreshToken }),
    }).catch(() => {
      // best-effort — cookies are cleared regardless
    });
  }
}
