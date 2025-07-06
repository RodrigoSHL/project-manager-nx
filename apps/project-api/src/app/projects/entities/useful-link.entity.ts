import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './project.entity';

export enum LinkType {
  DOCUMENTATION = 'documentation',
  DESIGN = 'design',
  MONITORING = 'monitoring',
  COMMUNICATION = 'communication',
  REPOSITORY = 'repository',
  DEPLOYMENT = 'deployment',
  TESTING = 'testing',
  OTHER = 'other'
}

@Entity('useful_links')
export class UsefulLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({
    type: 'enum',
    enum: LinkType
  })
  type: LinkType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'integer', default: 0 })
  order: number;

  @ManyToOne(() => Project, project => project.usefulLinks)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'uuid' })
  projectId: string;
} 