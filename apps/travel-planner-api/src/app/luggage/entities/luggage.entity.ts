import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { TripLuggage } from './trip-luggage.entity';

export enum LuggageType {
  PERSONAL_BACKPACK = 'personal_backpack',
  TRAVEL_BACKPACK = 'travel_backpack',
  PERSONAL_BAG = 'personal_bag',
  DUFFEL = 'duffel',
  CARRY_ON = 'carry_on',
  MEDIUM_SUITCASE = 'medium_suitcase',
  LARGE_SUITCASE = 'large_suitcase',
  CHECKED_SUITCASE = 'checked_suitcase',
  SPECIAL = 'special',
  CUSTOM = 'custom',
}

export interface LuggageDimensions {
  height: number;
  width: number;
  depth: number;
}

@Entity('luggage')
@Index('IDX_luggage_owner_id', ['ownerId'])
export class Luggage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ownerId: string;

  @Column({ length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 40 })
  type: LuggageType;

  @Column({ type: 'text', nullable: true })
  image: string | null;

  @Column({ length: 20, default: '#0ea5e9' })
  color: string;

  @Column({ length: 80, nullable: true })
  brand: string | null;

  @Column({ length: 80, nullable: true })
  model: string | null;

  @Column({ type: 'float', nullable: true })
  capacityLiters: number | null;

  @Column({ type: 'float', default: 0 })
  emptyWeight: number;

  @Column({ type: 'float', nullable: true })
  maxWeight: number | null;

  @Column({ type: 'jsonb', nullable: true })
  dimensions: LuggageDimensions | null;

  @Column({ default: false })
  cabinCompatible: boolean;

  @Column({ default: false })
  personalItemCompatible: boolean;

  @Column({ default: false })
  checkedBaggage: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ default: false })
  archived: boolean;

  @OneToMany(() => TripLuggage, (tripLuggage) => tripLuggage.luggage)
  tripAssignments: TripLuggage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
