import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum FindingSource {
  DIGITAL = 'DIGITAL',
  ANALOG = 'ANALOG',
  MANUAL = 'MANUAL',
}

export enum FindingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  DISCARDED = 'DISCARDED',
}

@Entity('finding_candidates')
@Index(
  'UQ_finding_candidates_work_item_source',
  ['tenantId', 'workId', 'workItemId', 'source'],
  { unique: true }
)
export class FindingCandidateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'work_id', type: 'uuid' })
  workId!: string;

  @Column({ name: 'work_item_id', type: 'uuid' })
  workItemId!: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId!: string;

  @Column({ name: 'concept_id', type: 'uuid', nullable: true })
  conceptId?: string | null;

  @Column({ type: 'varchar', length: 16 })
  source!: FindingSource;

  @Column({ length: 240 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'measured_value', type: 'text', nullable: true })
  measuredValue?: string | null;

  @Column({ name: 'min_value', type: 'double precision', nullable: true })
  minValue?: number | null;

  @Column({ name: 'max_value', type: 'double precision', nullable: true })
  maxValue?: number | null;

  @Column({ name: 'suggested_severity_id', type: 'uuid', nullable: true })
  suggestedSeverityId?: string | null;

  @Column({ type: 'varchar', length: 16, default: FindingStatus.PENDING })
  status!: FindingStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
