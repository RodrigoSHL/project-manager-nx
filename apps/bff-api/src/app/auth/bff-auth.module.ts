import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BffAuthController } from './bff-auth.controller';
import { BffAuthService } from './bff-auth.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'change-me-in-production',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any },
    }),
  ],
  controllers: [BffAuthController],
  providers: [BffAuthService],
  exports: [JwtModule],
})
export class BffAuthModule {}
