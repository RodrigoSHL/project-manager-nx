import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum ConceptType {
  ANALOG = 'ANALOG',
  DIGITAL = 'DIGITAL',
  TEXT = 'TEXT',
  HIDDEN = 'HIDDEN',
}

@Entity('concepts')
@Index('UQ_concepts_tenant_code', ['tenantId', 'code'], { unique: true })
@Index('UQ_concepts_id_tenant', ['id', 'tenantId'], { unique: true })
export class ConceptEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ length: 80 })
  code!: string;

  @Column({ length: 160 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'enum', enum: ConceptType, enumName: 'concept_type_enum' })
  type!: ConceptType;

  @Column({ type: 'varchar', length: 30, nullable: true })
  unit?: string | null;

  @Column({ name: 'min_value', type: 'double precision', nullable: true })
  minValue?: number | null;

  @Column({ name: 'max_value', type: 'double precision', nullable: true })
  maxValue?: number | null;

  @Column({ name: 'out_of_range_severity_id', type: 'uuid', nullable: true })
  outOfRangeSeverityId?: string | null;

  @Column({ default: true })
  active!: boolean;
}
