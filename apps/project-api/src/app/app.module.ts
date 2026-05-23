import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjectsModule } from './projects/projects.module';
import { FilesModule } from './files/files.module';
import { databaseConfig } from './config/database.config';
import { SprintsModule } from './sprints/sprints.module';
import { LabelsModule } from './labels/labels.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    ProjectsModule,
    FilesModule,
    SprintsModule,
    LabelsModule,
    TicketsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
