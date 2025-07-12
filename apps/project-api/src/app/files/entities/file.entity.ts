import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum FileType {
  MANUAL = 'manual',
  DIAGRAM = 'diagram',
  FLOW = 'flow',
  DOCUMENTATION = 'documentation',
  ARCHITECTURE = 'architecture',
  API_DOCS = 'api_docs',
  USER_GUIDE = 'user_guide',
  TECHNICAL_SPEC = 'technical_spec',
  REQUIREMENTS = 'requirements',
  DESIGN = 'design',
  TEST_PLAN = 'test_plan',
  DEPLOYMENT_GUIDE = 'deployment_guide',
  OTHER = 'other'
}

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

  @Column({
    type: 'enum',
    enum: FileType,
    default: FileType.OTHER
  })
  type: FileType;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

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