import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('asset_type_work_types')
@Index(
  'UQ_asset_type_work_types_tenant_pair',
  ['tenantId', 'assetTypeId', 'workTypeId'],
  { unique: true }
)
export class AssetTypeWorkTypeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'asset_type_id', type: 'uuid' })
  assetTypeId!: string;

  @Column({ name: 'work_type_id', type: 'uuid' })
  workTypeId!: string;

  @Column({ default: true })
  enabled!: boolean;
}
