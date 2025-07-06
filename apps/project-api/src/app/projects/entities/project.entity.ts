import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Repository } from './repository.entity';
import { Environment } from './environment.entity';
import { TeamMember } from './team-member.entity';
import { Task } from './task.entity';
import { Technology } from './technology.entity';
import { CloudService } from './cloud-service.entity';
import { UsefulLink } from './useful-link.entity';

export enum ProjectStatus {
  PLANNING = 'planning',
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  STAGING = 'staging',
  PRODUCTION = 'production',
  MAINTENANCE = 'maintenance',
  DEPRECATED = 'deprecated'
}

export enum ProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  businessUnit: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.PLANNING
  })
  status: ProjectStatus;

  @Column({
    type: 'enum',
    enum: ProjectPriority,
    default: ProjectPriority.MEDIUM
  })
  priority: ProjectPriority;

  @Column({ type: 'varchar', length: 50, nullable: true })
  version: string;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mainBranch: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastDeployment: string;

  @Column({ type: 'timestamp', nullable: true })
  lastDeploymentDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  authenticationType: string;

  @Column({ type: 'text', nullable: true })
  accessInstructions: string;

  @Column({ type: 'text', nullable: true })
  architectureDiagram: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  shortName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relaciones
  @OneToMany(() => Repository, repository => repository.project, { cascade: true })
  repositories: Repository[];

  @OneToMany(() => Environment, environment => environment.project, { cascade: true })
  environments: Environment[];

  @OneToMany(() => TeamMember, teamMember => teamMember.project, { cascade: true })
  teamMembers: TeamMember[];

  @OneToMany(() => Task, task => task.project, { cascade: true })
  tasks: Task[];

  @ManyToMany(() => Technology, { cascade: true })
  @JoinTable({
    name: 'project_technologies',
    joinColumn: { name: 'projectId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'technologyId', referencedColumnName: 'id' }
  })
  technologies: Technology[];

  @OneToMany(() => CloudService, cloudService => cloudService.project, { cascade: true })
  cloudServices: CloudService[];

  @OneToMany(() => UsefulLink, usefulLink => usefulLink.project, { cascade: true })
  usefulLinks: UsefulLink[];
} 