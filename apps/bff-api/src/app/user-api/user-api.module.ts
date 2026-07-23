import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserApiController } from './user-api.controller';
import { UserApiClient } from './user-api.client';

@Module({
  controllers: [UserApiController],
  providers: [UserApiClient, RolesGuard],
  exports: [UserApiClient],
})
export class UserApiModule {}
