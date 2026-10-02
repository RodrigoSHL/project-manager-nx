import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('asset_type_concepts')
@Index(
  'UQ_asset_type_concepts_tenant_pair',
  ['tenantId', 'assetTypeId', 'conceptId'],
  { unique: true }
)
export class AssetTypeConceptEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'asset_type_id', type: 'uuid' })
  assetTypeId!: string;

  @Column({ name: 'concept_id', type: 'uuid' })
  conceptId!: string;

  @Column({ name: 'sort_order', type: 'integer', nullable: true })
  order?: number | null;

  @Column({ default: true })
  active!: boolean;
}
