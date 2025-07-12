import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project } from './entities/project.entity';
import { Repository } from './entities/repository.entity';
import { Environment } from './entities/environment.entity';
import { TeamMember } from './entities/team-member.entity';
import { Task } from './entities/task.entity';
import { Technology } from './entities/technology.entity';
import { CloudService } from './entities/cloud-service.entity';
import { UsefulLink } from './entities/useful-link.entity';
import { File } from '../files/entities/file.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      Repository,
      Environment,
      TeamMember,
      Task,
      Technology,
      CloudService,
      UsefulLink,
      File
    ])
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService]
})
export class ProjectsModule {} 