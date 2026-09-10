import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('task_completions')
@Index(
  'UQ_task_completions_tenant_work_item',
  ['tenantId', 'workId', 'formItemId'],
  { unique: true }
)
export class TaskCompletionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'work_id', type: 'uuid' })
  workId!: string;

  @Column({ name: 'form_item_id', type: 'uuid' })
  formItemId!: string;

  @Column({ default: true })
  completed!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
