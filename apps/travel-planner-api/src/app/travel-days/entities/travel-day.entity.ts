import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Trip } from '../../trips/entities/trip.entity';

@Entity('travel_days')
@Unique(['tripId', 'date'])
export class TravelDay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tripId: string;

  @ManyToOne(() => Trip, (trip) => trip.travelDays, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @Column({ type: 'date' })
  date: string;

  @Column('text', { array: true, default: [] })
  countries: string[];

  @Column({ nullable: true })
  mainCity: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;
}
