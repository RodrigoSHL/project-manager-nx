import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('work_types')
@Index('UQ_work_types_tenant_code', ['tenantId', 'code'], { unique: true })
@Index('UQ_work_types_id_tenant', ['id', 'tenantId'], { unique: true })
export class WorkTypeEntity {
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

  @Column({ default: true })
  active!: boolean;
}
