import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('concept_responses')
@Index(
  'UQ_concept_responses_tenant_work_item',
  ['tenantId', 'workId', 'formItemId'],
  { unique: true }
)
export class ConceptResponseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'work_id', type: 'uuid' })
  workId!: string;

  @Column({ name: 'form_item_id', type: 'uuid' })
  formItemId!: string;

  @Column({ name: 'concept_id', type: 'uuid' })
  conceptId!: string;

  @Column({ name: 'value_number', type: 'double precision', nullable: true })
  valueNumber?: number | null;

  @Column({ name: 'value_text', type: 'text', nullable: true })
  valueText?: string | null;

  @Column({ name: 'selected_option_id', type: 'uuid', nullable: true })
  selectedOptionId?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
