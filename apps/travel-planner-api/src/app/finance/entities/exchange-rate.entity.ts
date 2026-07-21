import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('exchange_rates')
@Index('IDX_exchange_rates_trip_pair_date', ['tripId', 'fromCurrency', 'toCurrency', 'rateDate'])
export class ExchangeRate {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') tripId: string;
  @Column({ length: 3 }) fromCurrency: string;
  @Column({ length: 3 }) toCurrency: string;
  @Column({ type: 'numeric', precision: 24, scale: 12 }) rate: string;
  @Column({ type: 'date' }) rateDate: string;
  @Column({ nullable: true }) source: string | null;
  @Column('uuid') createdByUserId: string;
  @CreateDateColumn() createdAt: Date;
}
