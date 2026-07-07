import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';

export type ActivityType =
  | 'flight'
  | 'train'
  | 'bus'
  | 'transfer'
  | 'accommodation'
  | 'sightseeing'
  | 'food'
  | 'shopping'
  | 'document'
  | 'reminder'
  | 'free'
  | 'other';

export type ActivityStatus = 'pending' | 'confirmed' | 'reserved' | 'cancelled';
export type ActivityPriority = 'low' | 'medium' | 'high';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tripId: string;

  @ManyToOne(() => Trip, (trip) => trip.activities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @Column()
  title: string;

  @Column()
  type: ActivityType;

  @Column({ type: 'date' })
  date: string;

  @Column({ nullable: true })
  startTime: string;

  @Column({ nullable: true })
  endTime: string;

  @Column('text', { array: true, default: [] })
  countries: string[];

  @Column({ nullable: true })
  originCountry: string;

  @Column({ nullable: true })
  destinationCountry: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ default: 'pending' })
  status: ActivityStatus;

  @Column({ default: 'medium' })
  priority: ActivityPriority;

  @Column({ nullable: true })
  link: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
