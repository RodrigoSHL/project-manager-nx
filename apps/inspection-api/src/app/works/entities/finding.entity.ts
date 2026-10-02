import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FindingSource } from './finding-candidate.entity';

@Entity('findings')
@Index('UQ_findings_source_candidate', ['sourceCandidateId'], { unique: true })
export class FindingEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'work_id', type: 'uuid' }) workId!: string;
  @Column({ name: 'work_item_id', type: 'uuid' }) workItemId!: string;
  @Column({ name: 'asset_id', type: 'uuid' }) assetId!: string;
  @Column({ name: 'concept_id', type: 'uuid', nullable: true }) conceptId?:
    | string
    | null;
  @Column({ name: 'source_candidate_id', type: 'uuid' })
  sourceCandidateId!: string;
  @Column({ type: 'varchar', length: 16 }) source!: FindingSource;
  @Column({ length: 240 }) title!: string;
  @Column({ type: 'text', nullable: true }) description?: string | null;
  @Column({ name: 'measured_value', type: 'text', nullable: true })
  measuredValue?: string | null;
  @Column({ name: 'min_value', type: 'double precision', nullable: true })
  minValue?: number | null;
  @Column({ name: 'max_value', type: 'double precision', nullable: true })
  maxValue?: number | null;
  @Column({ name: 'severity_id', type: 'uuid', nullable: true }) severityId?:
    | string
    | null;
  @Column({ name: 'man_hours', type: 'double precision', nullable: true })
  manHours?: number | null;
  @Column({ type: 'text', nullable: true }) materials?: string | null;
  @Column({ name: 'asset_name_snapshot', length: 240 })
  assetNameSnapshot!: string;
  @Column({
    name: 'concept_name_snapshot',
    type: 'varchar',
    length: 240,
    nullable: true,
  })
  conceptNameSnapshot?: string | null;
  @Column({
    name: 'unit_snapshot',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  unitSnapshot?: string | null;
  @Column({ name: 'sort_order', type: 'integer' }) sortOrder!: number;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
