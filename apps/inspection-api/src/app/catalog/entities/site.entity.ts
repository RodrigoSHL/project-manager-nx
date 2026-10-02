import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum SiteType {
  MINE = 'MINE',
  PLANT = 'PLANT',
  SITE = 'SITE',
}

@Entity('sites')
@Index('UQ_sites_tenant_code', ['tenantId', 'code'], { unique: true })
@Index('UQ_sites_id_tenant', ['id', 'tenantId'], { unique: true })
export class SiteEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ length: 40 })
  code!: string;

  @Column({ length: 160 })
  name!: string;

  @Column({ type: 'enum', enum: SiteType, enumName: 'site_type_enum' })
  type!: SiteType;

  @Column({ default: true })
  active!: boolean;
}
