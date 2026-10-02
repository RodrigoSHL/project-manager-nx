import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { v5 as uuidv5 } from 'uuid';
import { ConceptType } from '../catalog/entities/concept.entity';
import { ConceptResponseEntity } from './entities/concept-response.entity';
import {
  FindingCandidateEntity,
  FindingSource,
  FindingStatus,
} from './entities/finding-candidate.entity';
import { WorkItemAnnotationEntity } from './entities/work-item-annotation.entity';
import { WorkEntity } from './entities/work.entity';

const namespace = '246f70bd-17c6-4f49-bcec-2f3d1fbbef43';

@Injectable()
export class FindingCandidateService {
  async reconcile(manager: EntityManager, work: WorkEntity) {
    const tenantId = work.tenantId;
    const workId = work.id;
    const [responses, annotations, existing] = await Promise.all([
      manager
        .getRepository(ConceptResponseEntity)
        .find({ where: { tenantId, workId } }),
      manager
        .getRepository(WorkItemAnnotationEntity)
        .find({ where: { tenantId, workId } }),
      manager
        .getRepository(FindingCandidateEntity)
        .find({ where: { tenantId, workId } }),
    ]);
    const responseByItem = new Map(
      responses.map((item) => [item.formItemId, item])
    );
    const annotationByItem = new Map(
      annotations.map((item) => [item.formItemId, item])
    );
    const desired: FindingCandidateEntity[] = [];
    for (const section of work.formSnapshot.sections) {
      for (const item of section.items) {
        const response = responseByItem.get(item.id);
        const annotation = annotationByItem.get(item.id);
        const concept = item.concept;
        const base = {
          tenantId,
          workId,
          workItemId: item.id,
          assetId: item.assetId ?? work.assetId,
          conceptId: concept?.id ?? null,
          status: FindingStatus.PENDING,
        };
        if (
          concept?.type === ConceptType.DIGITAL &&
          response?.selectedOptionId
        ) {
          const option = concept.options.find(
            (value) => value.id === response.selectedOptionId
          );
          if (option?.generatesFinding)
            desired.push(
              Object.assign(new FindingCandidateEntity(), {
                ...base,
                source: FindingSource.DIGITAL,
                title: `${concept.name}: ${option.label}`.slice(0, 240),
                description: `Opción marcada como hallazgo: ${option.label}`,
                measuredValue: option.label,
                minValue: null,
                maxValue: null,
                suggestedSeverityId: option.suggestedSeverityId ?? null,
              })
            );
        }
        if (
          concept?.type === ConceptType.ANALOG &&
          response?.valueNumber != null &&
          ((concept.minValue != null &&
            response.valueNumber < concept.minValue) ||
            (concept.maxValue != null &&
              response.valueNumber > concept.maxValue))
        ) {
          desired.push(
            Object.assign(new FindingCandidateEntity(), {
              ...base,
              source: FindingSource.ANALOG,
              title: `${concept.name} fuera de rango`.slice(0, 240),
              description: `Límite: ${concept.minValue ?? '—'} a ${
                concept.maxValue ?? '—'
              } ${concept.unit ?? ''}`.trim(),
              measuredValue: `${response.valueNumber}${
                concept.unit ? ` ${concept.unit}` : ''
              }`,
              minValue: concept.minValue ?? null,
              maxValue: concept.maxValue ?? null,
              suggestedSeverityId: concept.outOfRangeSeverityId ?? null,
            })
          );
        }
        if (annotation?.isFinding && annotation.comment.trim()) {
          desired.push(
            Object.assign(new FindingCandidateEntity(), {
              ...base,
              source: FindingSource.MANUAL,
              title: `${
                concept?.name ?? item.title ?? 'Observación'
              }: hallazgo manual`.slice(0, 240),
              description: annotation.comment.trim(),
              measuredValue: null,
              minValue: null,
              maxValue: null,
              suggestedSeverityId: null,
            })
          );
        }
      }
    }
    const repository = manager.getRepository(FindingCandidateEntity);
    const key = (item: Pick<FindingCandidateEntity, 'workItemId' | 'source'>) =>
      `${item.workItemId}:${item.source}`;
    const previous = new Map(existing.map((item) => [key(item), item]));
    const desiredKeys = new Set(desired.map(key));
    for (const candidate of desired) {
      const old = previous.get(key(candidate));
      if (old?.status !== undefined && old.status !== FindingStatus.PENDING)
        continue;
      candidate.id =
        old?.id ?? uuidv5(`${workId}:${key(candidate)}`, namespace);
      if (old) candidate.createdAt = old.createdAt;
      if (old && this.sameCandidate(old, candidate)) continue;
      await repository.save(candidate);
    }
    for (const old of existing) {
      if (old.status === FindingStatus.PENDING && !desiredKeys.has(key(old)))
        await repository.remove(old);
    }
  }

  private sameCandidate(a: FindingCandidateEntity, b: FindingCandidateEntity) {
    return (
      a.assetId === b.assetId &&
      a.conceptId === b.conceptId &&
      a.title === b.title &&
      a.description === b.description &&
      a.measuredValue === b.measuredValue &&
      a.minValue === b.minValue &&
      a.maxValue === b.maxValue &&
      a.suggestedSeverityId === b.suggestedSeverityId
    );
  }
}
