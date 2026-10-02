import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum FormItemType {
  CONCEPT = 'CONCEPT',
  TASK = 'TASK',
}

@Entity('form_items')
@Index(
  'UQ_form_items_tenant_section_order',
  ['tenantId', 'sectionId', 'order'],
  { unique: true }
)
export class FormItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'section_id', type: 'uuid' })
  sectionId!: string;

  @Column({
    type: 'enum',
    enum: FormItemType,
    enumName: 'form_item_type_enum',
  })
  type!: FormItemType;

  @Column({ name: 'sort_order', type: 'integer' })
  order!: number;

  @Column({ type: 'varchar', length: 160, nullable: true })
  title?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'concept_id', type: 'uuid', nullable: true })
  conceptId?: string | null;

  @Column({ default: false })
  required!: boolean;
}
