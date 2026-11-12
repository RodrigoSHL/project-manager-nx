import { Column, Entity, PrimaryColumn } from 'typeorm';
import type {
  CompletedTraining,
  TrainingDraft,
  TrainingExercise,
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

  @Column('jsonb')
  data!: CompletedTraining;
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
