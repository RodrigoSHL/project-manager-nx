import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UnauthorizedException,
  HttpCode,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BffAuthService } from './bff-auth.service';
import { LoginDto } from './dto/login.dto';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;        // 15 minutes
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Controller('api/auth')
export class BffAuthController {
  constructor(private readonly bffAuthService: BffAuthService) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } = await this.bffAuthService.login(dto);
    this.setAuthCookies(res, accessToken, refreshToken);
    return { user };
  }

  @Post('register')
  async register(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    return this.bffAuthService.register(body);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefreshToken = req.cookies?.refresh_token;
    if (!rawRefreshToken) {
      throw new UnauthorizedException('No refresh token');
    }
    const { accessToken, refreshToken, user } = await this.bffAuthService.refresh(rawRefreshToken);
    this.setAuthCookies(res, accessToken, refreshToken);
    return { user };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawRefreshToken = req.cookies?.refresh_token;
    if (rawRefreshToken) {
      await this.bffAuthService.logout(rawRefreshToken);
    }
    res.clearCookie('access_token', { ...COOKIE_OPTS });
    res.clearCookie('refresh_token', { ...COOKIE_OPTS });
    return { message: 'Logged out' };
  }

  /** Returns the user info from the JWT payload already validated by JwtCookieMiddleware */
  @Get('me')
  me(@Req() req: Request) {
    return {
      user: {
        id: req.headers['x-user-id'],
        email: req.headers['x-user-email'],
        roles: ((req.headers['x-user-roles'] as string) || '').split(',').filter(Boolean),
      },
    };
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, {
      ...COOKIE_OPTS,
      maxAge: ACCESS_TOKEN_TTL_MS,
    });
    res.cookie('refresh_token', refreshToken, {
      ...COOKIE_OPTS,
      maxAge: REFRESH_TOKEN_TTL_MS,
    });
  }
}
