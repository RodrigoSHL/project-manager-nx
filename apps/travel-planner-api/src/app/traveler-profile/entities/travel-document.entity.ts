import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum TravelDocumentType { IDENTITY='identity', PASSPORT='passport', VISA='visa', IMMIGRATION_PERMIT='immigration_permit', DRIVER_LICENSE='driver_license', INTERNATIONAL_DRIVER_PERMIT='international_driver_permit', VACCINATION='vaccination', PRESCRIPTION='prescription', MEDICAL_CERTIFICATE='medical_certificate', TRAVEL_INSURANCE='travel_insurance', ASSISTANCE_CERTIFICATE='assistance_certificate', ACCOMMODATION='accommodation', OTHER='other' }
export enum DocumentSensitivity { STANDARD='standard', SENSITIVE='sensitive', HIGHLY_SENSITIVE='highly_sensitive' }

@Entity('travel_documents')
@Index('IDX_travel_documents_owner_type', ['userId', 'type'])
@Index('IDX_travel_documents_owner_expiry', ['userId', 'expiresAt'])
export class TravelDocument {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') userId: string;
  @Column({ type: 'enum', enum: TravelDocumentType }) type: TravelDocumentType;
  @Column({ length: 160 }) displayName: string;
  @Column({ length: 2, nullable: true }) issuingCountry: string | null;
  @Column({ length: 255, nullable: true, select: false }) documentNumber: string | null;
  @Column({ type: 'date', nullable: true }) issuedAt: string | null;
  @Column({ type: 'date', nullable: true }) expiresAt: string | null;
  @Column({ length: 160, nullable: true }) holderName: string | null;
  @Column({ type: 'text', nullable: true }) notes: string | null;
  @Column({ type: 'text', array: true, default: () => "'{}'" }) tags: string[];
  @Column({ type: 'uuid', array: true, default: () => "'{}'" }) fileIds: string[];
  @Column({ type: 'enum', enum: DocumentSensitivity, default: DocumentSensitivity.SENSITIVE }) sensitivity: DocumentSensitivity;
  @Column({ default: false }) favorite: boolean;
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) details: Record<string, unknown>;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
  @DeleteDateColumn({ type: 'timestamptz', nullable: true }) deletedAt: Date | null;
}
