import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('form_templates')
@Index(
  'UQ_form_templates_tenant_work_type_version',
  ['tenantId', 'workTypeId', 'version'],
  { unique: true }
)
@Index('UQ_form_templates_id_tenant', ['id', 'tenantId'], { unique: true })
export class FormTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'work_type_id', type: 'uuid' })
  workTypeId!: string;

  @Column({ length: 160 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'integer', default: 1 })
  version!: number;

  @Column({ default: true })
  active!: boolean;
}
