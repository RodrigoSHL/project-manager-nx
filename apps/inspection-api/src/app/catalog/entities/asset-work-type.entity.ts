import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('asset_work_types')
@Index(
  'UQ_asset_work_types_tenant_pair',
  ['tenantId', 'assetId', 'workTypeId'],
  { unique: true }
)
export class AssetWorkTypeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'asset_id', type: 'uuid' })
  assetId!: string;

  @Column({ name: 'work_type_id', type: 'uuid' })
  workTypeId!: string;

  @Column({ default: true })
  enabled!: boolean;
}
