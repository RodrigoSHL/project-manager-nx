import type { AssetTypeWorkTypeOption } from '../work-types/models';
import type { Concept, ConceptOption } from '../concepts/models';
import type {
  FormItem,
  FormSection,
  FormTemplate,
} from '../form-templates/models';
import { assetCatalogApi } from '../assets/asset-catalog-api';
import { conceptApi } from '../concepts/concept-api';
import { formTemplateApi } from '../form-templates/form-template-api';
import type { WorkReferenceCatalog } from './models';

export type WorkSeedCatalog = WorkReferenceCatalog & {
  templates: FormTemplate[];
  sections: FormSection[];
  items: FormItem[];
  concepts: Concept[];
  options: ConceptOption[];
  workTypesByAssetType: Record<string, AssetTypeWorkTypeOption[]>;
};

export async function loadWorkSeedCatalog(
  tenantId: string
): Promise<WorkSeedCatalog> {
  const [sites, assetTypes, workTypes, formCatalog, conceptsWithOptions] =
    await Promise.all([
      assetCatalogApi.listSites(tenantId),
      assetCatalogApi.listAssetTypes(tenantId),
      assetCatalogApi.listWorkTypes(tenantId),
      formTemplateApi.list(tenantId),
      conceptApi.listConcepts(tenantId),
    ]);

  const [assetGroups, relationGroups] = await Promise.all([
    Promise.all(
      sites.map((site) => assetCatalogApi.listAssets(tenantId, site.id))
    ),
    Promise.all(
      assetTypes.map(
        async (assetType) =>
          [
            assetType.id,
            await assetCatalogApi.listAssetTypeWorkTypes(
              tenantId,
              assetType.id
            ),
          ] as const
      )
    ),
  ]);

  return {
    tenantId,
    sites,
    assets: assetGroups.flat(),
    workTypes,
    templates: formCatalog.templates,
    sections: formCatalog.sections,
    items: formCatalog.items,
    concepts: conceptsWithOptions.map((concept) => ({
      id: concept.id,
      tenantId: concept.tenantId,
      code: concept.code,
      name: concept.name,
      description: concept.description,
      type: concept.type,
      unit: concept.unit,
      active: concept.active,
    })),
    options: conceptsWithOptions.flatMap((concept) => concept.options),
    workTypesByAssetType: Object.fromEntries(relationGroups),
  };
}
