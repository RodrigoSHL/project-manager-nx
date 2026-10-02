import { v5 as uuidv5 } from 'uuid';
import type {
  FindingCandidate,
  Work,
  WorkItemValue,
  WorkTemplateSnapshot,
} from './models';

const namespace = '246f70bd-17c6-4f49-bcec-2f3d1fbbef43';

/** Preview and offline materialization use the same immutable work snapshot as the API. */
export function deriveFindingCandidates(
  work: Work,
  snapshot: WorkTemplateSnapshot,
  values: Record<string, WorkItemValue>,
  previous: FindingCandidate[] = []
): FindingCandidate[] {
  const prior = new Map(
    previous.map((item) => [`${item.workItemId}:${item.source}`, item])
  );
  const result: FindingCandidate[] = [];
  const now = new Date().toISOString();
  for (const item of snapshot.sections.flatMap((section) => section.items)) {
    const value = values[item.id] ?? {};
    const concept = item.concept;
    const add = (
      source: FindingCandidate['source'],
      title: string,
      description: string | null,
      measuredValue: string | null,
      severityId: string | null
    ) => {
      const old = prior.get(`${item.id}:${source}`);
      if (old && old.status !== 'PENDING') {
        result.push(old);
        return;
      }
      result.push({
        id: old?.id ?? uuidv5(`${work.id}:${item.id}:${source}`, namespace),
        tenantId: work.tenantId,
        workId: work.id,
        workItemId: item.id,
        assetId: item.assetId ?? work.assetId,
        conceptId: concept?.id ?? null,
        source,
        title: title.slice(0, 240),
        description,
        measuredValue,
        minValue: source === 'ANALOG' ? concept?.minValue ?? null : null,
        maxValue: source === 'ANALOG' ? concept?.maxValue ?? null : null,
        suggestedSeverityId: severityId,
        status: old?.status ?? 'PENDING',
        createdAt: old?.createdAt ?? now,
        updatedAt: now,
      });
    };
    if (concept?.type === 'DIGITAL' && value.selectedOptionId) {
      const option = concept.options.find(
        (entry) => entry.id === value.selectedOptionId
      );
      if (option?.generatesFinding)
        add(
          'DIGITAL',
          `${concept.name}: ${option.label}`,
          `Opción marcada como hallazgo: ${option.label}`,
          option.label,
          option.suggestedSeverityId ?? null
        );
    }
    if (
      concept?.type === 'ANALOG' &&
      value.valueNumber != null &&
      Number.isFinite(value.valueNumber) &&
      ((concept.minValue != null && value.valueNumber < concept.minValue) ||
        (concept.maxValue != null && value.valueNumber > concept.maxValue))
    ) {
      add(
        'ANALOG',
        `${concept.name} fuera de rango`,
        `Límite: ${concept.minValue ?? '—'} a ${concept.maxValue ?? '—'} ${
          concept.unit ?? ''
        }`.trim(),
        `${value.valueNumber}${concept.unit ? ` ${concept.unit}` : ''}`,
        concept.outOfRangeSeverityId ?? null
      );
    }
    if (value.isFinding && value.comment?.trim())
      add(
        'MANUAL',
        `${concept?.name ?? item.title ?? 'Observación'}: hallazgo manual`,
        value.comment.trim(),
        null,
        null
      );
  }
  // A reviewed decision is never silently discarded by a subsequent response change.
  for (const old of previous) {
    if (old.status !== 'PENDING' && !result.some((item) => item.id === old.id))
      result.push(old);
  }
  return result;
}
