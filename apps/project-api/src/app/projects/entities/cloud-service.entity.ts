import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './project.entity';

export enum CloudProvider {
  AWS = 'aws',
  AZURE = 'azure',
  GCP = 'gcp',
  DIGITAL_OCEAN = 'digital_ocean',
  HEROKU = 'heroku',
  VERCEL = 'vercel',
  NETLIFY = 'netlify'
}

@Entity('cloud_services')
export class CloudService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: CloudProvider
  })
  provider: CloudProvider;

  @Column({ type: 'varchar', length: 255, nullable: true })
  serviceType: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  endpoint: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  region: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  configuration: string;

  @ManyToOne(() => Project, project => project.cloudServices)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'uuid' })
  projectId: string;
} 