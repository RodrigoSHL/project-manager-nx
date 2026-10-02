import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export type ReportCoverDefaults = {
  content?: string | null;
  requestedBy?: string | null;
  preparedBy?: string | null;
  approvedBy?: string | null;
  distribution?: string | null;
  receivedBy?: string | null;
  introduction?: string | null;
};

@Entity('tenant_report_settings')
export class TenantReportSettingsEntity {
  @PrimaryColumn('uuid', { name: 'tenant_id' })
  tenantId!: string;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  defaults!: ReportCoverDefaults;

  @Column({ name: 'logo_data_uri', type: 'text', nullable: true })
  logoDataUri!: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
