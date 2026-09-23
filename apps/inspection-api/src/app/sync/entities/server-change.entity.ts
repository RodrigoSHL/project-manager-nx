import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ServerChangeOperation {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

@Entity('server_changes')
@Index('IDX_server_changes_tenant_sequence', ['tenantId', 'sequence'])
@Index('IDX_server_changes_tenant_site_sequence', [
  'tenantId',
  'siteId',
  'sequence',
])
export class ServerChangeEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  sequence!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'site_id', type: 'uuid', nullable: true })
  siteId!: string | null;

  @Column({ name: 'source_device_id', type: 'uuid', nullable: true })
  sourceDeviceId!: string | null;

  @Column({ name: 'entity_type', length: 32 })
  entityType!: string;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId!: string;

  @Column({ length: 10 })
  operation!: ServerChangeOperation;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamptz' })
  changedAt!: Date;
}
