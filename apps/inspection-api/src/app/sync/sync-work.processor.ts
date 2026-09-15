import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import { ConceptType } from '../catalog/entities/concept.entity';
import { FormItemType } from '../form-templates/entities/form-item.entity';
import { ConceptResponseEntity } from '../works/entities/concept-response.entity';
import { TaskCompletionEntity } from '../works/entities/task-completion.entity';
import { WorkEntity, WorkStatus } from '../works/entities/work.entity';
import { WorkItemAnnotationEntity } from '../works/entities/work-item-annotation.entity';
import type { WorkFormItemSnapshot } from '../works/work-snapshot';
import { WorksService } from '../works/works.service';
import { SyncEntityType, SyncOperation } from './dto/sync-push.dto';
import type {
  AnnotationPayload,
  ParsedChange,
  ResponsePayload,
  TaskPayload,
  WorkPayload,
} from './sync.types';

@Injectable()
export class SyncWorkProcessor {
  constructor(private readonly worksService: WorksService) {}

  async apply(
    manager: EntityManager,
    tenantId: string,
    changes: ParsedChange[]
  ) {
    const ordered = [...changes].sort(
      (left, right) =>
        this.entityOrder(left.entityType) -
          this.entityOrder(right.entityType) ||
        left.clientTimestamp.localeCompare(right.clientTimestamp)
    );
    let desiredStatus: WorkStatus | undefined;
    let work: WorkEntity | null = null;

    for (const change of ordered.filter(
      (item) => item.entityType === SyncEntityType.WORK
    )) {
      const payload = change.parsedPayload as WorkPayload;
      work = await this.applyWork(manager, tenantId, change, payload);
      desiredStatus = payload.status;
    }
    if (!work) {
      work = await manager.getRepository(WorkEntity).findOne({
        where: { id: changes[0].workId, tenantId },
      });
      if (!work) throw new NotFoundException('Parent work was not found');
    }
    this.assertEditable(work);

    for (const change of ordered.filter(
      (item) => item.entityType !== SyncEntityType.WORK
    )) {
      if (change.entityType === SyncEntityType.RESPONSE) {
        await this.applyResponse(
          manager,
          tenantId,
          work,
          change,
          change.parsedPayload as ResponsePayload
        );
      } else if (change.entityType === SyncEntityType.TASK_COMPLETION) {
        await this.applyTask(
          manager,
          tenantId,
          work,
          change,
          change.parsedPayload as TaskPayload
        );
      } else {
        await this.applyAnnotation(
          manager,
          tenantId,
          work,
          change,
          change.parsedPayload as AnnotationPayload
        );
      }
    }
    if (desiredStatus) {
      await this.applyFinalStatus(manager, tenantId, work, desiredStatus);
    }
  }

  private async applyWork(
    manager: EntityManager,
    tenantId: string,
    change: ParsedChange,
    payload: WorkPayload
  ) {
    const repository = manager.getRepository(WorkEntity);
    const foundById = await repository.findOne({ where: { id: payload.id } });
    if (change.operation === SyncOperation.DELETE) {
      throw new BadRequestException(
        'Deleting works through sync is not supported'
      );
    }
    if (change.operation === SyncOperation.CREATE) {
      if (foundById) {
        throw new BadRequestException(
          'The work UUID already exists without this outbox receipt'
        );
      }
      const prepared = await this.worksService.prepareSnapshotForSyncedWork(
        tenantId,
        payload.id,
        payload.siteId,
        payload.assetId,
        payload.workTypeId,
        payload.formTemplateId,
        payload.formTemplateVersion
      );
      return repository.save(
        repository.create({
          id: payload.id,
          tenantId,
          siteId: prepared.asset.siteId,
          assetId: prepared.asset.id,
          workTypeId: payload.workTypeId,
          formTemplateId: payload.formTemplateId,
          formTemplateVersion: payload.formTemplateVersion,
          title: payload.title,
          executionDate: payload.executionDate,
          responsible: payload.responsible,
          company: payload.company || null,
          status: WorkStatus.DRAFT,
          notes: payload.notes || null,
          formSnapshot: prepared.snapshot,
        })
      );
    }
    if (!foundById || foundById.tenantId !== tenantId) {
      throw new NotFoundException('Work not found in this tenant');
    }
    this.assertEditable(foundById);
    if (
      foundById.siteId !== payload.siteId ||
      foundById.assetId !== payload.assetId ||
      foundById.workTypeId !== payload.workTypeId ||
      foundById.formTemplateId !== payload.formTemplateId ||
      foundById.formTemplateVersion !== payload.formTemplateVersion
    ) {
      throw new BadRequestException(
        'The offline work does not match the server work definition'
      );
    }
    foundById.title = payload.title;
    foundById.executionDate = payload.executionDate;
    foundById.responsible = payload.responsible;
    foundById.company = payload.company || null;
    foundById.notes = payload.notes || null;
    return repository.save(foundById);
  }

  private async applyResponse(
    manager: EntityManager,
    tenantId: string,
    work: WorkEntity,
    change: ParsedChange,
    payload: ResponsePayload
  ) {
    const repository = manager.getRepository(ConceptResponseEntity);
    const existing = await repository.findOne({ where: { id: payload.id } });
    if (change.operation === SyncOperation.DELETE) {
      if (existing?.tenantId === tenantId && existing.workId === work.id) {
        await repository.remove(existing);
      }
      return;
    }
    const item = this.requireItem(work, payload.formItemId);
    if (
      item.type !== FormItemType.CONCEPT ||
      !item.concept ||
      item.concept.id !== payload.conceptId
    ) {
      throw new BadRequestException(
        'Response does not match a concept in the work snapshot'
      );
    }
    const value = this.normalizeResponse(item, payload);
    this.assertMutationTarget(
      change,
      existing,
      tenantId,
      work.id,
      'Response'
    );
    await repository.save(
      repository.create({
        ...existing,
        id: payload.id,
        tenantId,
        workId: work.id,
        formItemId: payload.formItemId,
        conceptId: payload.conceptId,
        ...value,
      })
    );
  }

  private async applyTask(
    manager: EntityManager,
    tenantId: string,
    work: WorkEntity,
    change: ParsedChange,
    payload: TaskPayload
  ) {
    const repository = manager.getRepository(TaskCompletionEntity);
    const existing = await repository.findOne({ where: { id: payload.id } });
    if (change.operation === SyncOperation.DELETE) {
      if (existing?.tenantId === tenantId && existing.workId === work.id) {
        await repository.remove(existing);
      }
      return;
    }
    if (this.requireItem(work, payload.formItemId).type !== FormItemType.TASK) {
      throw new BadRequestException('Completion is not a task in the snapshot');
    }
    this.assertMutationTarget(
      change,
      existing,
      tenantId,
      work.id,
      'Task completion'
    );
    await repository.save(
      repository.create({
        ...existing,
        id: payload.id,
        tenantId,
        workId: work.id,
        formItemId: payload.formItemId,
        completed: payload.completed,
      })
    );
  }

  private async applyAnnotation(
    manager: EntityManager,
    tenantId: string,
    work: WorkEntity,
    change: ParsedChange,
    payload: AnnotationPayload
  ) {
    const repository = manager.getRepository(WorkItemAnnotationEntity);
    const existing = await repository.findOne({ where: { id: payload.id } });
    if (change.operation === SyncOperation.DELETE) {
      if (existing?.tenantId === tenantId && existing.workId === work.id) {
        await repository.remove(existing);
      }
      return;
    }
    this.requireItem(work, payload.formItemId);
    this.assertMutationTarget(
      change,
      existing,
      tenantId,
      work.id,
      'Annotation'
    );
    await repository.save(
      repository.create({
        ...existing,
        id: payload.id,
        tenantId,
        workId: work.id,
        formItemId: payload.formItemId,
        comment: payload.comment,
      })
    );
  }

  private assertMutationTarget(
    change: ParsedChange,
    existing: { tenantId: string; workId: string } | null,
    tenantId: string,
    workId: string,
    label: string
  ) {
    if (change.operation === SyncOperation.CREATE && existing) {
      throw new BadRequestException(`${label} UUID already exists`);
    }
    if (change.operation === SyncOperation.UPDATE && !existing) {
      throw new NotFoundException(`${label} to update was not found`);
    }
    if (existing && (existing.tenantId !== tenantId || existing.workId !== workId)) {
      throw new BadRequestException(
        `${label} belongs to another work or tenant`
      );
    }
  }

  private async applyFinalStatus(
    manager: EntityManager,
    tenantId: string,
    work: WorkEntity,
    desiredStatus: WorkStatus
  ) {
    if (desiredStatus === WorkStatus.REVIEWED) {
      throw new BadRequestException('Offline review is not supported');
    }
    if (desiredStatus === WorkStatus.DRAFT) {
      if (work.status !== WorkStatus.DRAFT) {
        throw new BadRequestException('Work status cannot move back to DRAFT');
      }
      return;
    }
    if (desiredStatus === WorkStatus.FINISHED) {
      await this.assertRequiredItemsCompleted(manager, tenantId, work);
      work.status = WorkStatus.FINISHED;
    } else {
      work.status = WorkStatus.IN_PROGRESS;
    }
    await manager.getRepository(WorkEntity).save(work);
  }

  private async assertRequiredItemsCompleted(
    manager: EntityManager,
    tenantId: string,
    work: WorkEntity
  ) {
    const [responses, tasks] = await Promise.all([
      manager.getRepository(ConceptResponseEntity).find({
        where: { tenantId, workId: work.id },
      }),
      manager.getRepository(TaskCompletionEntity).find({
        where: { tenantId, workId: work.id },
      }),
    ]);
    const completed = new Set([
      ...responses.map((item) => item.formItemId),
      ...tasks
        .filter((item) => item.completed)
        .map((item) => item.formItemId),
    ]);
    const missing = work.formSnapshot.sections.flatMap((section) =>
      section.items
        .filter(
          (item) =>
            item.required &&
            (item.type === FormItemType.TASK ||
              item.concept?.type !== ConceptType.HIDDEN) &&
            !completed.has(item.id)
        )
        .map((item) => item.title || item.concept?.name || 'Required field')
    );
    if (missing.length > 0) {
      throw new BadRequestException({
        message: `Faltan ${missing.length} campos obligatorios.`,
        missingLabels: missing,
      });
    }
  }

  private normalizeResponse(
    item: WorkFormItemSnapshot,
    payload: ResponsePayload
  ) {
    const concept = item.concept;
    if (!concept) throw new BadRequestException('Snapshot concept is missing');
    if (
      concept.type === ConceptType.ANALOG &&
      Number.isFinite(payload.valueNumber)
    ) {
      return {
        valueNumber: payload.valueNumber,
        valueText: null,
        selectedOptionId: null,
      };
    }
    if (concept.type === ConceptType.TEXT && payload.valueText?.trim()) {
      return {
        valueNumber: null,
        valueText: payload.valueText.trim(),
        selectedOptionId: null,
      };
    }
    if (
      concept.type === ConceptType.DIGITAL &&
      payload.selectedOptionId &&
      concept.options.some((option) => option.id === payload.selectedOptionId)
    ) {
      return {
        valueNumber: null,
        valueText: null,
        selectedOptionId: payload.selectedOptionId,
      };
    }
    throw new BadRequestException(
      `Response value does not match concept type ${concept.type}`
    );
  }

  private requireItem(work: WorkEntity, formItemId: string) {
    const item = work.formSnapshot.sections
      .flatMap((section) => section.items)
      .find((candidate) => candidate.id === formItemId);
    if (!item) {
      throw new BadRequestException('Form item is not in the work snapshot');
    }
    return item;
  }

  private assertEditable(work: WorkEntity) {
    if ([WorkStatus.FINISHED, WorkStatus.REVIEWED].includes(work.status)) {
      throw new BadRequestException(
        'The server work is closed and cannot accept offline changes'
      );
    }
  }

  private entityOrder(type: SyncEntityType) {
    if (type === SyncEntityType.WORK) return 0;
    if (type === SyncEntityType.RESPONSE) return 1;
    if (type === SyncEntityType.TASK_COMPLETION) return 2;
    return 3;
  }
}
