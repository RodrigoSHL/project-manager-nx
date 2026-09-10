import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { WorkTemplateSnapshot } from '../work-snapshot';

export enum WorkStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  REVIEWED = 'REVIEWED',
}

@Entity('works')
@Index('UQ_works_id_tenant', ['id', 'tenantId'], { unique: true })
@Index('IDX_works_tenant_site', ['tenantId', 'siteId'])
@Index('IDX_works_tenant_asset', ['tenantId', 'assetId'])
export class WorkEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'site_id', type: 'uuid' })
  siteId!: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId!: string;

  @Column({ name: 'work_type_id', type: 'uuid' })
  workTypeId!: string;

  @Column({ name: 'form_template_id', type: 'uuid' })
  formTemplateId!: string;

  @Column({ name: 'form_template_version', type: 'integer' })
  formTemplateVersion!: number;

  @Column({ length: 200 })
  title!: string;

  @Column({ name: 'execution_date', type: 'date' })
  executionDate!: string;

  @Column({ length: 160 })
  responsible!: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  company?: string | null;

  @Column({ type: 'enum', enum: WorkStatus, enumName: 'work_status_enum' })
  status!: WorkStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ name: 'form_snapshot', type: 'jsonb' })
  formSnapshot!: WorkTemplateSnapshot;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
