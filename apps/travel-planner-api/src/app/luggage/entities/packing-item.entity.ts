import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';
import { TripLuggage } from './trip-luggage.entity';

export enum PackingCategory {
  DOCUMENTS = 'documents',
  MONEY = 'money',
  TOPS = 'tops',
  BOTTOMS = 'bottoms',
  UNDERWEAR = 'underwear',
  OUTERWEAR = 'outerwear',
  FOOTWEAR = 'footwear',
  HYGIENE = 'hygiene',
  HEALTH = 'health',
  TECHNOLOGY = 'technology',
  PHOTOGRAPHY = 'photography',
  WORK = 'work',
  SPORT = 'sport',
  BEACH = 'beach',
  ACCESSORIES = 'accessories',
  FOOD = 'food',
  SAFETY = 'safety',
  ENTERTAINMENT = 'entertainment',
  SHARED = 'shared',
  SHOPPING = 'shopping',
  OTHER = 'other',
}

export enum PackingPriority {
  ESSENTIAL = 'essential',
  HIGH = 'high',
  NORMAL = 'normal',
  OPTIONAL = 'optional',
}

export enum PackMoment {
  ADVANCE = 'advance',
  WEEK_BEFORE = 'week_before',
  DAY_BEFORE = 'day_before',
  SAME_DAY = 'same_day',
  BEFORE_LEAVING = 'before_leaving',
}

export enum PackingItemStatus {
  PENDING = 'pending',
  TO_BUY = 'to_buy',
  BORROWED = 'borrowed',
  SKIPPED = 'skipped',
  DECIDING = 'deciding',
  IN_USE = 'in_use',
  EQUIPPED = 'equipped',
  MISSING = 'missing',
}

export enum BaggagePolicy {
  ALLOWED = 'allowed',
  NOT_RECOMMENDED = 'not_recommended',
  PROHIBITED = 'prohibited',
  CHECK_AIRLINE = 'check_airline',
}

@Entity('packing_items')
@Index('IDX_packing_items_trip_user', ['tripId', 'userId'])
export class PackingItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tripId: string;

  @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @Column()
  userId: string;

  @Column('uuid', { nullable: true })
  luggageId: string | null;

  @ManyToOne(() => TripLuggage, (tripLuggage) => tripLuggage.items, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'luggageId' })
  tripLuggage: TripLuggage | null;

  @Column({ length: 80, nullable: true })
  catalogItemId: string | null;

  @Column({ length: 140 })
  name: string;

  @Column({ type: 'varchar', length: 32 })
  category: PackingCategory;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ default: false })
  haveIt: boolean;

  @Column({ default: false })
  packed: boolean;

  @Column({ default: false })
  purchaseRequired: boolean;

  @Column({ type: 'varchar', length: 20, default: PackingItemStatus.PENDING })
  status: PackingItemStatus;

  @Column({ type: 'varchar', length: 20, default: PackingPriority.NORMAL })
  priority: PackingPriority;

  @Column({ type: 'float', default: 0 })
  estimatedWeight: number;

  @Column({ type: 'float', nullable: true })
  actualWeight: number | null;

  @Column({ type: 'varchar', length: 24, default: PackMoment.ADVANCE })
  packMoment: PackMoment;

  @Column({ default: false })
  shared: boolean;

  @Column({ default: false })
  private: boolean;

  @Column({ nullable: true })
  responsibleUserId: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ length: 32, default: 'manual' })
  source: string;

  @Column({ length: 80, nullable: true })
  ruleId: string | null;

  @Column({ type: 'text', nullable: true })
  explanation: string | null;

  @Column({ type: 'varchar', length: 24, default: BaggagePolicy.CHECK_AIRLINE })
  cabinPolicy: BaggagePolicy;

  @Column({ type: 'varchar', length: 24, default: BaggagePolicy.ALLOWED })
  checkedPolicy: BaggagePolicy;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
