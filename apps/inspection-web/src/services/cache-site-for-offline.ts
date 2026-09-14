import { inspectionDb, offlineSiteKey } from '../db/inspection-db';
import { assetCatalogApi } from '../features/assets/asset-catalog-api';
import { conceptApi } from '../features/concepts/concept-api';
import { formTemplateApi } from '../features/form-templates/form-template-api';
import type {
  LocalConceptResponse,
  LocalFileReference,
  LocalTaskCompletion,
  LocalWork,
  LocalWorkItemAnnotation,
  OfflineCatalogBundle,
} from '../features/offline/models';
import { workApi } from '../features/works/work-api';
import { listWorkPhotos } from '../features/works/work-photo-api';

export async function cacheSiteForOffline(tenantId: string, siteId: string) {
  const id = offlineSiteKey(tenantId, siteId);
  await inspectionDb.offlineSites.put({
    id,
    tenantId,
    siteId,
    status: 'DOWNLOADING',
  });
  try {
    const [
      tenants,
      sites,
      assets,
      assetTypes,
      workTypes,
      forms,
      conceptRows,
      assetTypeConcepts,
      workCatalog,
    ] = await Promise.all([
      assetCatalogApi.listTenants(),
      assetCatalogApi.listSites(tenantId),
      assetCatalogApi.listAssets(tenantId, siteId),
      assetCatalogApi.listAssetTypes(tenantId),
      assetCatalogApi.listWorkTypes(tenantId),
      formTemplateApi.list(tenantId),
      conceptApi.listConcepts(tenantId),
      conceptApi.listAssetTypeConcepts(tenantId),
      workApi.list(tenantId),
    ]);
    const tenant = tenants.find((item) => item.id === tenantId);
    const site = sites.find(
      (item) => item.id === siteId && item.tenantId === tenantId
    );
    if (!tenant || !site)
      throw new Error('El sitio no pertenece a la empresa seleccionada.');

    const configurationGroups = await Promise.all(
      assets.map(async (asset) => {
        const rows = await assetCatalogApi.listAssetWorkTypeConfigurations(
          tenantId,
          siteId,
          asset.id
        );
        return rows.map((row) => ({
          ...row,
          recordId: `${asset.id}:${row.id}`,
          tenantId,
          assetId: asset.id,
        }));
      })
    );
    const works = workCatalog.works.filter(
      (work) => work.tenantId === tenantId && work.siteId === siteId
    );
    const workIds = new Set(works.map((work) => work.id));
    const photoGroups = await Promise.all(
      works.map((work) => listWorkPhotos(tenantId, work.id).catch(() => []))
    );
    const bundle: OfflineCatalogBundle = {
      tenant,
      site,
      assets,
      assetTypes,
      workTypes,
      workTypeConfigurations: configurationGroups.flat(),
      concepts: conceptRows.map((concept) => ({
        id: concept.id,
        tenantId: concept.tenantId,
        code: concept.code,
        name: concept.name,
        description: concept.description,
        type: concept.type,
        unit: concept.unit,
        active: concept.active,
      })),
      options: conceptRows.flatMap((concept) => concept.options),
      assetTypeConcepts,
      templates: forms.templates,
      sections: forms.sections,
      items: forms.items,
      works,
      responses: workCatalog.responses.filter((item) =>
        workIds.has(item.workId)
      ),
      taskCompletions: workCatalog.taskCompletions.filter((item) =>
        workIds.has(item.workId)
      ),
      annotations: workCatalog.annotations.filter((item) =>
        workIds.has(item.workId)
      ),
      snapshots: workCatalog.snapshots.filter((item) =>
        workIds.has(item.workId)
      ),
      photos: photoGroups.flat(),
    };
    await saveBundle(bundle);
    const downloadedAt = new Date().toISOString();
    await inspectionDb.offlineSites.put({
      id,
      tenantId,
      siteId,
      tenantName: tenant.name,
      siteName: site.name,
      status: 'READY',
      downloadedAt,
    });
    return { downloadedAt, counts: countBundle(bundle) };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'No fue posible descargar el sitio.';
    await inspectionDb.offlineSites.put({
      id,
      tenantId,
      siteId,
      status: 'ERROR',
      error: message,
    });
    throw error;
  }
}

async function saveBundle(bundle: OfflineCatalogBundle) {
  const remoteWorks: LocalWork[] = bundle.works.map((item) => ({
    ...item,
    syncStatus: 'SYNCED',
  }));
  const responses: LocalConceptResponse[] = bundle.responses.map((item) => ({
    ...item,
    syncStatus: 'SYNCED',
  }));
  const tasks: LocalTaskCompletion[] = bundle.taskCompletions.map((item) => ({
    ...item,
    syncStatus: 'SYNCED',
  }));
  const annotations: LocalWorkItemAnnotation[] = bundle.annotations.map(
    (item) => ({ ...item, syncStatus: 'SYNCED' })
  );
  const files: LocalFileReference[] = bundle.photos.map((photo) => ({
    id: photo.id,
    remoteFileId: photo.id,
    tenantId: bundle.tenant.id,
    workId: photo.ownerId,
    workItemId: photo.metadata.formItemId,
    mimeType: photo.mimeType,
    originalName: photo.originalName,
    size: photo.size,
    status: 'REMOTE_ONLY',
  }));

  await inspectionDb.transaction(
    'rw',
    [
      inspectionDb.tenants,
      inspectionDb.sites,
      inspectionDb.assets,
      inspectionDb.assetTypes,
      inspectionDb.workTypes,
      inspectionDb.workTypeConfigurations,
      inspectionDb.concepts,
      inspectionDb.conceptOptions,
      inspectionDb.assetTypeConcepts,
      inspectionDb.formTemplates,
      inspectionDb.formSections,
      inspectionDb.formItems,
      inspectionDb.works,
      inspectionDb.conceptResponses,
      inspectionDb.taskCompletions,
      inspectionDb.annotations,
      inspectionDb.snapshots,
      inspectionDb.fileReferences,
    ],
    async () => {
      const assetIds = new Set(bundle.assets.map((asset) => asset.id));
      const existingConfigurations = await inspectionDb.workTypeConfigurations
        .where('tenantId')
        .equals(bundle.tenant.id)
        .filter((item) => assetIds.has(item.assetId))
        .toArray();
      const existingConceptRelations = await inspectionDb.assetTypeConcepts
        .where('tenantId')
        .equals(bundle.tenant.id)
        .toArray();
      await Promise.all([
        inspectionDb.workTypeConfigurations.bulkDelete(
          existingConfigurations.map((item) => item.recordId)
        ),
        inspectionDb.assetTypeConcepts.bulkDelete(
          existingConceptRelations.map((item) => item.id)
        ),
      ]);
      await inspectionDb.tenants.put(bundle.tenant);
      await inspectionDb.sites.put(bundle.site);
      await Promise.all([
        inspectionDb.assets.bulkPut(bundle.assets),
        inspectionDb.assetTypes.bulkPut(bundle.assetTypes),
        inspectionDb.workTypes.bulkPut(bundle.workTypes),
        inspectionDb.workTypeConfigurations.bulkPut(
          bundle.workTypeConfigurations
        ),
        inspectionDb.concepts.bulkPut(bundle.concepts),
        inspectionDb.conceptOptions.bulkPut(bundle.options),
        inspectionDb.assetTypeConcepts.bulkPut(bundle.assetTypeConcepts),
        inspectionDb.formTemplates.bulkPut(bundle.templates),
        inspectionDb.formSections.bulkPut(bundle.sections),
        inspectionDb.formItems.bulkPut(bundle.items),
        inspectionDb.snapshots.bulkPut(bundle.snapshots),
        inspectionDb.fileReferences.bulkPut(files),
      ]);
      await putUnlessLocallyChanged(inspectionDb.works, remoteWorks);
      await putUnlessLocallyChanged(inspectionDb.conceptResponses, responses);
      await putUnlessLocallyChanged(inspectionDb.taskCompletions, tasks);
      await putUnlessLocallyChanged(inspectionDb.annotations, annotations);
    }
  );
}

async function putUnlessLocallyChanged(
  table: {
    get(id: string): Promise<{ syncStatus: string } | undefined>;
    put(value: never): Promise<unknown>;
  },
  rows: Array<{ id: string; syncStatus: string }>
) {
  for (const row of rows) {
    const existing = await table.get(row.id);
    if (!existing || existing.syncStatus === 'SYNCED')
      await table.put(row as never);
  }
}

function countBundle(bundle: OfflineCatalogBundle) {
  return {
    assets: bundle.assets.length,
    works: bundle.works.length,
    templates: bundle.templates.length,
    photos: bundle.photos.length,
  };
}
