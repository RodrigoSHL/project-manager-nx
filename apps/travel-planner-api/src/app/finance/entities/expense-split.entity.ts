import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Expense } from './expense.entity';

@Entity('expense_splits')
@Unique('UQ_expense_split_participant', ['expenseId', 'participantUserId'])
@Index('IDX_expense_splits_participant', ['participantUserId'])
export class ExpenseSplit {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') expenseId: string;
  @ManyToOne(() => Expense, (expense) => expense.splits, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'expenseId' }) expense: Expense;
  @Column('uuid') participantUserId: string;
  @Column({ type: 'bigint' }) amountMinor: string;
  @Column({ type: 'numeric', precision: 9, scale: 6, nullable: true }) percentage: string | null;
  @Column({ type: 'numeric', precision: 16, scale: 6, nullable: true }) shares: string | null;
  @Column({ default: true }) generatesDebt: boolean;
}
