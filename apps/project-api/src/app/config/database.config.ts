import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Project } from '../projects/entities/project.entity';
import { Repository } from '../projects/entities/repository.entity';
import { Environment } from '../projects/entities/environment.entity';
import { TeamMember } from '../projects/entities/team-member.entity';
import { Task } from '../projects/entities/task.entity';
import { Technology } from '../projects/entities/technology.entity';
import { CloudService } from '../projects/entities/cloud-service.entity';
import { UsefulLink } from '../projects/entities/useful-link.entity';
import { File } from '../files/entities/file.entity';
import { Sprint } from '../sprints/entities/sprint.entity';
import { Label } from '../labels/entities/label.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Comment } from '../comments/entities/comment.entity';
import { Subtask } from '../subtasks/entities/subtask.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'project_management_db',
  entities: [
    Project,
    Repository,
    Environment,
    TeamMember,
    Task,
    Technology,
    CloudService,
    UsefulLink,
    File,
    Sprint,
    Label,
    Ticket,
    Comment,
    Subtask,
  ],
  synchronize: process.env.TYPEORM_SYNCHRONIZE
    ? process.env.TYPEORM_SYNCHRONIZE === 'true'
    : process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
}; 
