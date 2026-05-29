import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { User, UserStatus } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'password'>;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  register(dto: RegisterDto): Promise<User> {
    return this.usersService.create(dto);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: normalizedEmail })
      .getOne();

    if (!user?.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(dto.password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User is not active');
    }

    const { password: _, ...safeUser } = user;
    return this.issueTokens(safeUser as Omit<User, 'password'>);
  }

  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    const tokenHash = this.hashToken(rawRefreshToken);

    const stored = await this.refreshTokenRepo.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (!stored || !stored.isValid) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke the used token (rotation)
    stored.revokedAt = new Date();
    await this.refreshTokenRepo.save(stored);

    const { password: _, ...safeUser } = stored.user as User & { password?: string };
    return this.issueTokens(safeUser as Omit<User, 'password'>);
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.refreshTokenRepo.update({ tokenHash }, { revokedAt: new Date() });
  }

  private async issueTokens(user: Omit<User, 'password'>): Promise<AuthTokens> {
    const payload = { sub: user.id, email: user.email, roles: user.roles };
    const accessToken = this.jwtService.sign(payload);

    // Generate a cryptographically random refresh token
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const refreshTokenEntity = this.refreshTokenRepo.create({
      tokenHash,
      userId: user.id,
      expiresAt,
    });
    await this.refreshTokenRepo.save(refreshTokenEntity);

    return { accessToken, refreshToken: rawRefreshToken, user };
  }

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }
}
