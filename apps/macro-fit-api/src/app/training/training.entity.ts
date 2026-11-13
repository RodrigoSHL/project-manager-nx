import { Column, Entity, PrimaryColumn } from 'typeorm';
import type {
  CompletedTraining,
  TrainingDraft,
  TrainingExercise,
  TrainingRoutine,
} from '@project-manager/macrofit-contracts';

@Entity('training_drafts')
export class TrainingDraftEntity {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId!: string;

  @Column('integer', { default: 0 })
  revision!: number;

  @Column('jsonb', { nullable: true })
  draft!: TrainingDraft | null;
}

@Entity('training_sessions')
export class TrainingSessionEntity {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId!: string;

  @PrimaryColumn('uuid')
  id!: string;

  @Column('timestamptz', { name: 'finished_at' })
  finishedAt!: Date;

  @Column('date', { name: 'performed_on' })
  performedOn!: string;

  @Column('integer', { default: 0 })
  revision!: number;

  @Column('jsonb')
  data!: Omit<CompletedTraining, 'performedOn' | 'revision'>;
}

@Entity('training_custom_exercises')
export class TrainingExerciseEntity {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId!: string;

  @PrimaryColumn('uuid')
  id!: string;

  @Column('jsonb')
  data!: TrainingExercise;
}

@Entity('training_routines')
export class TrainingRoutineEntity {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId!: string;

  @PrimaryColumn('uuid')
  id!: string;

  @Column('jsonb')
  data!: TrainingRoutine;
}
