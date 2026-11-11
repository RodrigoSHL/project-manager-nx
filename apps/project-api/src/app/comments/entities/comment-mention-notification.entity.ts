import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export interface MentionEmailPayload {
  to: string[];
  recipientName: string;
  authorName: string;
  projectName: string;
  ticketKey: string;
  ticketTitle: string;
  commentText: string;
  workspaceId: string;
  projectId: string;
  ticketId: string;
  commentId: string;
}

@Entity('comment_mention_notifications')
@Index('UQ_comment_mention_recipient', ['commentId', 'recipientUserId'], {
  unique: true,
})
@Index('IDX_comment_mention_pending', ['status', 'nextAttemptAt'])
@Index('IDX_comment_mention_app_pending', ['createdAt'], {
  where: `"status" = 'sent' AND "appPublishedAt" IS NULL`,
})
export class CommentMentionNotification {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) commentId: string;
  @Column({ type: 'uuid' }) memberId: string;
  @Column({ type: 'uuid' }) recipientUserId: string;
  @Column({ type: 'jsonb' }) payload: MentionEmailPayload;
  @Column({ type: 'jsonb', nullable: true })
  deliveryPayload: MentionEmailPayload | null;
  @Column({ type: 'varchar', length: 20, default: 'pending' }) status:
    | 'pending'
    | 'processing'
    | 'sent'
    | 'failed'
    | 'skipped';
  @Column({ type: 'integer', default: 0 }) attempts: number;
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  nextAttemptAt: Date;
  @Column({ type: 'timestamptz', nullable: true }) lockedUntil: Date | null;
  @Column({ type: 'varchar', length: 100, nullable: true }) lastCode:
    | string
    | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @Column({ type: 'timestamptz', nullable: true }) appPublishedAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true })
  appNextAttemptAt: Date | null;
}
