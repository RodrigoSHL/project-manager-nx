import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';
import { Activity } from '../../activities/entities/activity.entity';
import { ExpenseSplit } from './expense-split.entity';

export type ExpenseType = 'individual' | 'shared';
export type SplitMethod = 'equal' | 'custom_amount' | 'percentage' | 'shares' | 'gift';
export type ExpenseStatus = 'estimated' | 'pending' | 'partial' | 'paid' | 'cancelled';

@Entity('expenses')
@Index('IDX_expenses_trip_date', ['tripId', 'incurredAt'])
@Index('IDX_expenses_trip_category', ['tripId', 'category'])
@Index('IDX_expenses_trip_payer', ['tripId', 'payerUserId'])
export class Expense {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') tripId: string;
  @ManyToOne(() => Trip, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'tripId' }) trip: Trip;
  @Column({ length: 180 }) title: string;
  @Column({ type: 'bigint' }) originalAmountMinor: string;
  @Column({ length: 3 }) originalCurrency: string;
  @Column({ type: 'numeric', precision: 24, scale: 12, default: 1 }) exchangeRate: string;
  @Column({ type: 'bigint' }) convertedAmountMinor: string;
  @Column({ length: 3 }) baseCurrency: string;
  @Column({ type: 'date', nullable: true }) exchangeRateDate: string | null;
  @Column({ nullable: true }) exchangeRateSource: string | null;
  @Column({ length: 40 }) category: string;
  @Column({ nullable: true }) subcategory: string | null;
  @Column({ type: 'timestamptz' }) incurredAt: Date;
  @Column({ nullable: true }) city: string | null;
  @Column('uuid') createdByUserId: string;
  @Column('uuid', { nullable: true }) updatedByUserId: string | null;
  @Column('uuid') payerUserId: string;
  @Column({ default: 'individual' }) expenseType: ExpenseType;
  @Column({ default: 'equal' }) splitMethod: SplitMethod;
  @Column('uuid', { nullable: true, unique: true }) activityId: string | null;
  @ManyToOne(() => Activity, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'activityId' }) activity: Activity | null;
  @Column({ nullable: true }) paymentMethod: string | null;
  @Column({ default: 'paid' }) status: ExpenseStatus;
  @Column({ type: 'text', nullable: true }) notes: string | null;
  @Column({ nullable: true }) receiptUrl: string | null;
  @Column({ type: 'jsonb', default: [] }) items: Array<{ description: string; amountMinor: string }>;
  @Column('uuid', { nullable: true }) recurringGroupId: string | null;
  @OneToMany(() => ExpenseSplit, (split) => split.expense, { cascade: true }) splits: ExpenseSplit[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
  @DeleteDateColumn() deletedAt: Date | null;
}
