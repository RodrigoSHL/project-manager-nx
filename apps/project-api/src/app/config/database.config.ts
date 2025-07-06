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
    File
  ],
  synchronize: true, // Crear tablas automáticamente en desarrollo
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
}; 