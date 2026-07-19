import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';
import { PackingItem } from './packing-item.entity';
import { Luggage } from './luggage.entity';

export enum LuggageOccupancy {
  EMPTY = 'empty',
  LOW = 'low',
  HALF = 'half',
  ALMOST_FULL = 'almost_full',
  FULL = 'full',
}

export enum TripLuggageStatus {
  PLANNED = 'planned',
  PACKING = 'packing',
  READY = 'ready',
}

@Entity('trip_luggage')
@Unique('UQ_trip_luggage_trip_luggage', ['tripId', 'luggageId'])
@Index('IDX_trip_luggage_trip_id', ['tripId'])
export class TripLuggage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tripId: string;

  @ManyToOne(() => Trip, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @Column('uuid')
  luggageId: string;

  @ManyToOne(() => Luggage, (luggage) => luggage.tripAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'luggageId' })
  luggage: Luggage;

  @Column()
  ownerId: string;

  @Column({ type: 'float', nullable: true })
  actualWeight: number | null;

  @Column({ type: 'varchar', length: 24, default: LuggageOccupancy.EMPTY })
  occupancyLevel: LuggageOccupancy;

  @Column({ type: 'float', nullable: true })
  maxWeightOverride: number | null;

  @Column({ type: 'varchar', length: 20, default: TripLuggageStatus.PLANNED })
  status: TripLuggageStatus;

  @OneToMany(() => PackingItem, (item) => item.tripLuggage)
  items: PackingItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
