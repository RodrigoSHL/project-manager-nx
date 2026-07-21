import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity('trip_documents')
@Unique('UQ_trip_documents_trip_document', ['tripId', 'documentId'])
@Index('IDX_trip_documents_owner_trip', ['userId', 'tripId'])
export class TripDocument {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') userId: string;
  @Column('uuid') tripId: string;
  @Column('uuid') documentId: string;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}

export enum ChecklistStatus { PENDING='pending', IN_PROGRESS='in_progress', COMPLETED='completed', NOT_APPLICABLE='not_applicable' }
@Entity('trip_document_checklist')
@Index('IDX_trip_document_checklist_owner_trip', ['userId', 'tripId'])
export class TripDocumentChecklist {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') userId: string;
  @Column('uuid') tripId: string;
  @Column({ length: 180 }) label: string;
  @Column({ type: 'enum', enum: ChecklistStatus, default: ChecklistStatus.PENDING }) status: ChecklistStatus;
  @Column({ default: false }) suggested: boolean;
  @Column({ type: 'int', default: 0 }) position: number;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
