import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('traveler_profiles')
@Index('UQ_traveler_profiles_user', ['userId'], { unique: true })
export class TravelerProfile {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') userId: string;
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) personal: Record<string, unknown>;
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) medical: Record<string, unknown>;
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) privacy: Record<string, unknown>;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
