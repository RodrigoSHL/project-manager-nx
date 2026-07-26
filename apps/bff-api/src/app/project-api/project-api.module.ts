import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UserApiModule } from '../user-api/user-api.module';
import { ProjectAccessService } from './project-access.service';
import { ProjectApiClient } from './project-api.client';
import { ProjectApiController } from './project-api.controller';

@Module({
  imports: [AuthModule, UserApiModule],
  controllers: [ProjectApiController],
  providers: [ProjectApiClient, ProjectAccessService],
  exports: [ProjectApiClient],
})
export class ProjectApiModule {}
