import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum TechnologyCategory {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  DATABASE = 'database',
  INFRASTRUCTURE = 'infrastructure',
  TOOL = 'tool',
  FRAMEWORK = 'framework',
  LIBRARY = 'library'
}

@Entity('technologies')
export class Technology {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  version: string;

  @Column({
    type: 'enum',
    enum: TechnologyCategory
  })
  category: TechnologyCategory;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  documentation: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
} 