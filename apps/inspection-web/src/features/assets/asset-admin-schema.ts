import { z } from 'zod';
import type { Asset } from './models';

export const assetAdminSchema = z.object({
  code: z.string().trim().min(1, 'El código es obligatorio').max(60),
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(180),
  assetTypeId: z.string().trim().min(1, 'El tipo es obligatorio'),
  parentId: z.string().uuid().nullable(),
  status: z.enum(['ACTIVE', 'OUT_OF_SERVICE', 'INACTIVE']),
  description: z.string().trim().max(2000).nullable(),
});

export type AssetAdminForm = z.infer<typeof assetAdminSchema>;

export const emptyAssetAdminForm: AssetAdminForm = {
  code: '',
  name: '',
  assetTypeId: '',
  parentId: null,
  status: 'ACTIVE',
  description: null,
};

export function assetToAdminForm(asset: Asset): AssetAdminForm {
  return {
    code: asset.code,
    name: asset.name,
    assetTypeId: asset.assetTypeId,
    parentId: asset.parentId,
    status: asset.status,
    description: asset.description ?? null,
  };
}
