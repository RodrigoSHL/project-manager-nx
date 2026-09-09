import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('concept_options')
@Index(
  'UQ_concept_options_tenant_concept_value',
  ['tenantId', 'conceptId', 'value'],
  { unique: true }
)
export class ConceptOptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'concept_id', type: 'uuid' })
  conceptId!: string;

  @Column({ length: 80 })
  value!: string;

  @Column({ length: 160 })
  label!: string;

  @Column({ name: 'sort_order', type: 'integer' })
  order!: number;

  @Column({ default: true })
  active!: boolean;
}
