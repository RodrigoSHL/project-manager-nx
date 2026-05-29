import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjectsModule } from './projects/projects.module';
import { FilesModule } from './files/files.module';
import { databaseConfig } from './config/database.config';
import { SprintsModule } from './sprints/sprints.module';
import { LabelsModule } from './labels/labels.module';
import { TicketsModule } from './tickets/tickets.module';
import { CommentsModule } from './comments/comments.module';
import { SubtasksModule } from './subtasks/subtasks.module';
import { InternalAuthGuard } from './guards/internal-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    ProjectsModule,
    FilesModule,
    SprintsModule,
    LabelsModule,
    TicketsModule,
    CommentsModule,
    SubtasksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global guard: every endpoint requires X-User-Id (injected by BFF)
    { provide: APP_GUARD, useClass: InternalAuthGuard },
  ],
})
export class AppModule {}
