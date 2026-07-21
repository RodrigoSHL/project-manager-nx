import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Trip } from './trip.entity';

export enum TripMemberRole {
  VIEWER = 'viewer',
  EDITOR = 'editor',
}

@Entity('trip_members')
@Unique('UQ_trip_members_trip_user', ['tripId', 'userId'])
@Index('IDX_trip_members_user_id', ['userId'])
export class TripMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tripId: string;

  @ManyToOne(() => Trip, (trip) => trip.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @Column('uuid')
  userId: string;

  @Column({ type: 'enum', enum: TripMemberRole })
  role: TripMemberRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
