import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum AssetStatus {
  ACTIVE = 'ACTIVE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
  INACTIVE = 'INACTIVE',
}

@Entity('assets')
@Index('UQ_assets_tenant_site_code', ['tenantId', 'siteId', 'code'], {
  unique: true,
})
@Index('UQ_assets_id_tenant_site', ['id', 'tenantId', 'siteId'], {
  unique: true,
})
@Index('IDX_assets_parent', ['parentId'])
export class AssetEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'site_id', type: 'uuid' })
  siteId!: string;

  @Column({ length: 60 })
  code!: string;

  @Column({ length: 180 })
  name!: string;

  @Column({ length: 80 })
  type!: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId!: string | null;

  @Column({
    type: 'enum',
    enum: AssetStatus,
    enumName: 'asset_status_enum',
  })
  status!: AssetStatus;

  @Column({ type: 'text', nullable: true })
  description?: string | null;
}
