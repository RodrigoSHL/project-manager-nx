import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SyncEntityType, SyncOperation } from '../dto/sync-push.dto';

export enum SyncOperationStatus {
  PROCESSED = 'PROCESSED',
  ERROR = 'ERROR',
}

@Entity('sync_operations')
@Index('UQ_sync_operations_tenant_outbox', ['tenantId', 'outboxId'], {
  unique: true,
})
@Index('IDX_sync_operations_tenant_device', ['tenantId', 'deviceId'])
@Index('IDX_sync_operations_tenant_entity', [
  'tenantId',
  'entityType',
  'entityId',
])
export class SyncOperationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'device_id', type: 'uuid' })
  deviceId!: string;

  @Column({ name: 'outbox_id', type: 'uuid' })
  outboxId!: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 32 })
  entityType!: SyncEntityType;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId!: string;

  @Column({ type: 'varchar', length: 10 })
  operation!: SyncOperation;

  @Column({ type: 'varchar', length: 16 })
  status!: SyncOperationStatus;

  @Column({ type: 'integer', default: 1 })
  attempts!: number;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError?: string | null;

  @Column({ name: 'client_timestamp', type: 'timestamptz' })
  clientTimestamp!: Date;

  @CreateDateColumn({ name: 'received_at', type: 'timestamptz' })
  receivedAt!: Date;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt?: Date | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
