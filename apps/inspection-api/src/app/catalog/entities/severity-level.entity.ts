import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('severity_levels')
@Index('UQ_severity_levels_tenant_code', ['tenantId', 'code'], { unique: true })
export class SeverityLevelEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ length: 80 })
  code!: string;

  @Column({ length: 160 })
  name!: string;

  @Column({ name: 'sort_order', type: 'integer' })
  order!: number;

  @Column({ default: true })
  active!: boolean;
}
