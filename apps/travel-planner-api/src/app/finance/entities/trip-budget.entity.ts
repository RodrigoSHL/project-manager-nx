import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';

@Entity('trip_budgets')
export class TripBudget {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid', { unique: true }) tripId: string;
  @OneToOne(() => Trip, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'tripId' }) trip: Trip;
  @Column({ type: 'bigint' }) amountMinor: string;
  @Column({ length: 3 }) currency: string;
  @Column({ type: 'jsonb', default: {} }) categoryBudgets: Record<string, string>;
  @Column({ type: 'jsonb', default: {} }) personalBudgets: Record<string, string>;
  @Column({ type: 'int', array: true, default: [75, 90, 100] }) alertThresholds: number[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
