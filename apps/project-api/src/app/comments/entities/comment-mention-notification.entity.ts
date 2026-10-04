import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Comment } from './comment.entity';

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
export class CommentMentionNotification {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) commentId: string;
  @ManyToOne(() => Comment, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'commentId',
    foreignKeyConstraintName: 'FK_comment_mention_comment',
  })
  comment: Comment;
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
}
