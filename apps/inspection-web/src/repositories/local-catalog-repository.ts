import { inspectionDb } from '../db/inspection-db';
import type { EffectiveWorkType } from '../features/work-types/models';

export const localCatalogRepository = {
  listTenants: () => inspectionDb.tenants.toArray(),
  listSites: (tenantId: string) =>
    inspectionDb.sites.where('tenantId').equals(tenantId).toArray(),
  listAssets: (tenantId: string, siteId: string) =>
    inspectionDb.assets
      .where('[tenantId+siteId]')
      .equals([tenantId, siteId])
      .toArray(),
  listAssetTypes: (tenantId: string) =>
    inspectionDb.assetTypes.where('tenantId').equals(tenantId).toArray(),
  async listConceptCatalog(tenantId: string) {
    const [concepts, options, relations] = await Promise.all([
      inspectionDb.concepts.where('tenantId').equals(tenantId).toArray(),
      inspectionDb.conceptOptions.where('tenantId').equals(tenantId).toArray(),
      inspectionDb.assetTypeConcepts
        .where('tenantId')
        .equals(tenantId)
        .toArray(),
    ]);
    return { concepts, options, relations };
  },
  async listEffectiveWorkTypes(
    tenantId: string,
    assetId: string
  ): Promise<EffectiveWorkType[]> {
    const configs = await inspectionDb.workTypeConfigurations
      .where('[tenantId+assetId]')
      .equals([tenantId, assetId])
      .toArray();
    return configs
      .filter((item) => item.active && item.effectiveEnabled)
      .map(
        ({
          id,
          tenantId: rowTenantId,
          code,
          name,
          description,
          active,
          source,
        }) => ({
          id,
          tenantId: rowTenantId,
          code,
          name,
          description,
          active,
          source: source === 'ASSET' ? 'ASSET' : 'ASSET_TYPE',
        })
      );
  },
};
