import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type SettlementStatus = 'posted' | 'void';

@Entity('settlements')
@Index('IDX_settlements_trip_date', ['tripId', 'settledAt'])
export class Settlement {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') tripId: string;
  @Column('uuid') fromUserId: string;
  @Column('uuid') toUserId: string;
  @Column({ type: 'bigint' }) amountMinor: string;
  @Column({ length: 3 }) currency: string;
  @Column({ type: 'timestamptz' }) settledAt: Date;
  @Column({ type: 'text', nullable: true }) note: string | null;
  @Column({ nullable: true }) referenceUrl: string | null;
  @Column({ default: 'posted' }) status: SettlementStatus;
  @Column('uuid') createdByUserId: string;
  @Column('uuid', { nullable: true }) voidedByUserId: string | null;
  @Column({ type: 'timestamptz', nullable: true }) voidedAt: Date | null;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
