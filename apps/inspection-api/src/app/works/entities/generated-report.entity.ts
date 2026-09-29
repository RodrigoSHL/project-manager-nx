import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum GeneratedReportStatus {
  DRAFT = 'DRAFT',
  FINAL = 'FINAL',
}

@Entity('generated_reports')
@Index('UQ_generated_reports_work_version', ['tenantId', 'workId', 'version'], {
  unique: true,
})
export class GeneratedReportEntity {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId!: string;
  @Column({ name: 'work_id', type: 'uuid' }) workId!: string;
  @Column({ type: 'integer' }) version!: number;
  @Column({ type: 'varchar', length: 8 }) status!: GeneratedReportStatus;
  @Column({ name: 'report_snapshot', type: 'jsonb' }) reportSnapshot!: Record<
    string,
    unknown
  >;
  @CreateDateColumn({ name: 'generated_at', type: 'timestamptz' })
  generatedAt!: Date;
  @Column({
    name: 'generated_by',
    type: 'varchar',
    length: 160,
    nullable: true,
  })
  generatedBy!: string | null;
}
