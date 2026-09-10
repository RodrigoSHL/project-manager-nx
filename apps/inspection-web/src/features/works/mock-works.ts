import { createTemplateSnapshot } from './work-snapshot';
import type { WorkSeedCatalog } from './work-reference-loader';
import type {
  ConceptResponse,
  TaskCompletion,
  Work,
  WorkStatus,
  WorkTemplateSnapshot,
} from './models';

export type MockWorkSeed = {
  works: Work[];
  responses: ConceptResponse[];
  taskCompletions: TaskCompletion[];
  snapshots: WorkTemplateSnapshot[];
};

const statuses: WorkStatus[] = [
  'IN_PROGRESS',
  'FINISHED',
  'DRAFT',
  'REVIEWED',
  'IN_PROGRESS',
];
const people = [
  'Juan Pérez',
  'María Soto',
  'Carlos Rojas',
  'Ana Morales',
  'Diego Silva',
];

export function createMockWorkSeed(catalog: WorkSeedCatalog): MockWorkSeed {
  const validPairs = catalog.assets.flatMap((asset) => {
    const enabledIds = new Set(
      (catalog.workTypesByAssetType[asset.assetTypeId] ?? [])
        .filter((item) => item.associated && item.active)
        .map((item) => item.id)
    );
    return catalog.templates
      .filter(
        (template) =>
          template.tenantId === catalog.tenantId &&
          template.active &&
          enabledIds.has(template.workTypeId)
      )
      .map((template) => ({ asset, template }));
  });

  const selected = pickDistinctAssets(validPairs, 5);
  const works: Work[] = [];
  const responses: ConceptResponse[] = [];
  const taskCompletions: TaskCompletion[] = [];
  const snapshots: WorkTemplateSnapshot[] = [];

  selected.forEach(({ asset, template }, index) => {
    const workType = catalog.workTypes.find(
      (item) => item.id === template.workTypeId
    );
    if (!workType) return;
    const now = new Date(Date.now() - index * 86_400_000).toISOString();
    const work: Work = {
      id: crypto.randomUUID(),
      tenantId: catalog.tenantId,
      siteId: asset.siteId,
      assetId: asset.id,
      workTypeId: workType.id,
      formTemplateId: template.id,
      formTemplateVersion: template.version,
      title: `${workType.name} · ${asset.name}`,
      executionDate: now.slice(0, 10),
      responsible: people[index % people.length],
      company:
        index % 2 === 0 ? 'Cuadrilla eléctrica interna' : 'Servicios Andinos',
      status: statuses[index % statuses.length],
      notes:
        index === 0
          ? 'Ejecución de ejemplo parcialmente completada.'
          : undefined,
      createdAt: now,
      updatedAt: now,
    };
    const snapshot = createTemplateSnapshot(
      work.id,
      work.tenantId,
      template.id,
      catalog
    );
    const conceptItems = snapshot.sections
      .flatMap((section) => section.items)
      .filter(
        (item) => item.type === 'CONCEPT' && item.concept?.type !== 'HIDDEN'
      );
    const taskItems = snapshot.sections
      .flatMap((section) => section.items)
      .filter((item) => item.type === 'TASK');
    const filledItems =
      work.status === 'FINISHED' || work.status === 'REVIEWED'
        ? conceptItems
        : conceptItems.slice(0, index === 2 ? 0 : 2);

    works.push(work);
    snapshots.push(snapshot);
    filledItems.forEach((item, responseIndex) => {
      if (!item.concept) return;
      const timestamp = now;
      const base: ConceptResponse = {
        id: crypto.randomUUID(),
        tenantId: work.tenantId,
        workId: work.id,
        formItemId: item.id,
        conceptId: item.concept.id,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      if (item.concept.type === 'ANALOG') {
        responses.push({
          ...base,
          valueNumber: 68 + index * 2 + responseIndex,
        });
        return;
      }
      if (item.concept.type === 'DIGITAL') {
        const option = item.concept.options[0];
        if (option) responses.push({ ...base, selectedOptionId: option.id });
        return;
      }
      responses.push({ ...base, valueText: 'Sin novedades relevantes.' });
    });
    if (work.status === 'FINISHED' || work.status === 'REVIEWED') {
      taskCompletions.push(
        ...taskItems.map((item) => ({
          id: crypto.randomUUID(),
          tenantId: work.tenantId,
          workId: work.id,
          formItemId: item.id,
          completed: true,
          createdAt: now,
          updatedAt: now,
        }))
      );
    }
  });

  return { works, responses, taskCompletions, snapshots };
}

function pickDistinctAssets<T extends { asset: { id: string } }>(
  values: T[],
  count: number
) {
  const picked: T[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value.asset.id)) continue;
    seen.add(value.asset.id);
    picked.push(value);
    if (picked.length === count) break;
  }
  return picked;
}
