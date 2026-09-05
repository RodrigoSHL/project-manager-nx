import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserApiController } from './user-api.controller';
import { UserApiClient } from './user-api.client';
import { WorkspaceAccessService } from './workspace-access.service';

@Module({
  controllers: [UserApiController],
  providers: [UserApiClient, RolesGuard, WorkspaceAccessService],
  exports: [UserApiClient, WorkspaceAccessService],
})
export class UserApiModule {}
