import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Activity } from '../../activities/entities/activity.entity';
import { TravelDay } from '../../travel-days/entities/travel-day.entity';

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'date', nullable: true })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string;

  @Column({ nullable: true })
  coverImage: string;

  @OneToMany(() => Activity, (activity) => activity.trip, { cascade: true })
  activities: Activity[];

  @OneToMany(() => TravelDay, (day) => day.trip, { cascade: true })
  travelDays: TravelDay[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
