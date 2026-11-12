import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

export interface SprintCompletionSummary {
  totalTickets: number;
  doneTickets: number;
  cancelledTickets: number;
  movedTickets: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  targetSprintId: string | null;
  targetSprintName: string | null;
  tickets: { id: string; key: string; title: string; status: string; storyPoints: number | null }[];
}

@Entity('sprints')
export class Sprint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  projectId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  goal: string;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ type: 'integer', nullable: true })
  weeklyCapacityPoints: number | null;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  completionSummary: SprintCompletionSummary | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;
}
