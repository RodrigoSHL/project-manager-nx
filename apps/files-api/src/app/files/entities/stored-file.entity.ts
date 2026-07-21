import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

const bigintTransformer = {
  from: (value: string): number => Number(value),
  to: (value: number): number => value,
};

@Entity('stored_files')
@Index('IDX_stored_files_owner', ['application', 'ownerType', 'ownerId'])
export class StoredFile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  application!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ownerType!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ownerId!: string | null;

  @Column({ type: 'varchar', length: 255 })
  originalName!: string;

  @Column({ type: 'varchar', length: 150 })
  mimeType!: string;

  @Column({ type: 'bigint', transformer: bigintTransformer })
  size!: number;

  @Column({ type: 'char', length: 64 })
  checksumSha256!: string;

  @Column({ type: 'varchar', length: 50 })
  storageProvider!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  storageKey!: string;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
