import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectApiClient } from './project-api.client';
import { ProjectApiController } from './project-api.controller';

@Module({
  imports: [AuthModule],
  controllers: [ProjectApiController],
  providers: [ProjectApiClient],
  exports: [ProjectApiClient],
})
export class ProjectApiModule {}
