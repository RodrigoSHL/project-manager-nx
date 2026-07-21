import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum TravelerResourceKind { INSURANCE='insurance', EMERGENCY_CONTACT='emergency_contact', IMPORTANT_ADDRESS='important_address', MEDICATION='medication', REMINDER='reminder' }

@Entity('traveler_resources')
@Index('IDX_traveler_resources_owner_kind', ['userId', 'kind'])
export class TravelerResource {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') userId: string;
  @Column({ type: 'enum', enum: TravelerResourceKind }) kind: TravelerResourceKind;
  @Column({ length: 160 }) name: string;
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) data: Record<string, unknown>;
  @Column({ default: false }) favorite: boolean;
  @Column({ default: 0 }) priority: number;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
  @DeleteDateColumn({ type: 'timestamptz', nullable: true }) deletedAt: Date | null;
}
