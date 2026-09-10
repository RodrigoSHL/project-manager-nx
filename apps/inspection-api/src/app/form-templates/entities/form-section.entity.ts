import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('form_sections')
@Index(
  'UQ_form_sections_tenant_template_order',
  ['tenantId', 'formTemplateId', 'order'],
  { unique: true }
)
@Index('UQ_form_sections_id_tenant', ['id', 'tenantId'], { unique: true })
export class FormSectionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'form_template_id', type: 'uuid' })
  formTemplateId!: string;

  @Column({ length: 160 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'sort_order', type: 'integer' })
  order!: number;
}
