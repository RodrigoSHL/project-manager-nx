import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('currency_preferences')
export class CurrencyPreference {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  userId!: string;

  @Column({ type: 'varchar', length: 3, default: 'CLP' })
  baseCurrency!: string;

  @Column({
    type: 'jsonb',
    default: () => `'["EUR","USD","CHF","GBP"]'::jsonb`,
  })
  targetCurrencies!: string[];

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  feePercent!: string;

  @Column({
    type: 'jsonb',
    default: () => `'[1000,10000,50000,100000]'::jsonb`,
  })
  quickAmounts!: number[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
