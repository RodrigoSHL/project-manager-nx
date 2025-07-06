import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  filename: string;

  @Column({ type: 'varchar', length: 100 })
  mimetype: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ type: 'bytea' })
  fileData: Buffer;

  @CreateDateColumn()
  uploadedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  projectId: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  requestId: string;
} 