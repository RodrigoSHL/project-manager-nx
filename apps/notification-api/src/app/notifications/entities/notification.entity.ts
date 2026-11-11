import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notifications')
@Index(
  'IDX_notifications_unread',
  ['application', 'projectId', 'recipientId'],
  { where: '"readAt" IS NULL' }
)
@Index('IDX_notifications_inbox', [
  'application',
  'projectId',
  'recipientId',
  'createdAt',
  'id',
])
@Index(
  'UQ_notifications_event',
  ['application', 'projectId', 'recipientId', 'eventKey'],
  { unique: true }
)
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  application!: string;

  @Column({ type: 'varchar', length: 255 })
  projectId!: string;

  @Column({ type: 'varchar', length: 255 })
  recipientId!: string;

  @Column({ type: 'varchar', length: 100, default: 'info' })
  type!: string;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 200, nullable: true })
  eventKey!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  readAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
