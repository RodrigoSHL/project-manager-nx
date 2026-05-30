import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserApiClient } from '../user-api/user-api.client';
import { RegisterDto } from './dto/register.dto';
import { AuthenticatedUser } from './types/authenticated-user';

@Injectable()
export class AuthService {
  constructor(
    private readonly userApiClient: UserApiClient,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<AuthenticatedUser> {
    const user = await this.userApiClient.validateCredentials(email, password);

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
    };
  }

  register(dto: RegisterDto) {
    return this.userApiClient.createUser(dto);
  }

  async login(user: AuthenticatedUser): Promise<{ access_token: string; user: AuthenticatedUser }> {
    const payload = {
      sub: user.userId,
      email: user.email,
      name: user.name,
      roles: user.roles,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user,
    };
  }
}
