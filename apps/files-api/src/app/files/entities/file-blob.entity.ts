import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('file_blobs')
export class FileBlob {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  storageKey!: string;

  @Column({ type: 'bytea' })
  data!: Buffer;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
