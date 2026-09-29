import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { CatalogService } from '../catalog/catalog.service';
import { ConceptType } from '../catalog/entities/concept.entity';
import { ConceptOptionEntity } from '../catalog/entities/concept-option.entity';
import { ConceptEntity } from '../catalog/entities/concept.entity';
import type { AssetEntity } from '../catalog/entities/asset.entity';
import {
  FormItemEntity,
  FormItemType,
} from '../form-templates/entities/form-item.entity';
import { FormSectionEntity } from '../form-templates/entities/form-section.entity';
import { FormTemplateEntity } from '../form-templates/entities/form-template.entity';
import { CreateWorkDto } from './dto/create-work.dto';
import {
  ConceptResponseValueDto,
  SaveWorkResponsesDto,
  TaskCompletionValueDto,
  WorkItemAnnotationValueDto,
} from './dto/save-work-responses.dto';
import { ConceptResponseEntity } from './entities/concept-response.entity';
import { TaskCompletionEntity } from './entities/task-completion.entity';
import { WorkEntity, WorkStatus } from './entities/work.entity';
import { WorkItemAnnotationEntity } from './entities/work-item-annotation.entity';
import type {
  WorkFormItemSnapshot,
  WorkTemplateSnapshot,
} from './work-snapshot';
import { workItemInstanceId } from './work-item-id';
import { FindingCandidateEntity } from './entities/finding-candidate.entity';
import { FindingCandidateService } from './finding-candidate.service';
import { SeverityLevelEntity } from '../catalog/entities/severity-level.entity';

type NormalizedWorkResponses = {
  responses: Array<ConceptResponseValueDto & { conceptId: string }>;
  taskCompletions: TaskCompletionValueDto[];
  annotations: WorkItemAnnotationValueDto[];
};

@Injectable()
export class WorksService {
  constructor(
    private readonly catalog: CatalogService,
    @InjectRepository(WorkEntity)
    private readonly works: Repository<WorkEntity>,
    @InjectRepository(ConceptResponseEntity)
    private readonly responses: Repository<ConceptResponseEntity>,
    @InjectRepository(TaskCompletionEntity)
    private readonly taskCompletions: Repository<TaskCompletionEntity>,
    @InjectRepository(WorkItemAnnotationEntity)
    private readonly annotations: Repository<WorkItemAnnotationEntity>,
    @InjectRepository(FormTemplateEntity)
    private readonly templates: Repository<FormTemplateEntity>,
    @InjectRepository(FormSectionEntity)
    private readonly sections: Repository<FormSectionEntity>,
    @InjectRepository(FormItemEntity)
    private readonly items: Repository<FormItemEntity>,
    @InjectRepository(ConceptEntity)
    private readonly concepts: Repository<ConceptEntity>,
    @InjectRepository(ConceptOptionEntity)
    private readonly options: Repository<ConceptOptionEntity>,
    @InjectRepository(FindingCandidateEntity)
    private readonly findingCandidates: Repository<FindingCandidateEntity>,
    private readonly dataSource: DataSource,
    private readonly findingCandidateService: FindingCandidateService
  ) {}

  async list(tenantId: string) {
    await this.catalog.listSites(tenantId);
    const [
      works,
      responses,
      taskCompletions,
      annotations,
      findingCandidates,
      severityLevels,
    ] = await Promise.all([
      this.works.find({
        where: { tenantId },
        order: { executionDate: 'DESC', createdAt: 'DESC' },
      }),
      this.responses.find({ where: { tenantId } }),
      this.taskCompletions.find({ where: { tenantId } }),
      this.annotations.find({ where: { tenantId } }),
      this.findingCandidates.find({ where: { tenantId } }),
      this.dataSource
        .getRepository(SeverityLevelEntity)
        .find({ where: { tenantId }, order: { order: 'ASC' } }),
    ]);
    return {
      works: works.map((work) => this.toPublicWork(work)),
      responses,
      taskCompletions,
      annotations,
      findingCandidates,
      severityLevels,
      snapshots: works.map((work) => work.formSnapshot),
    };
  }

  async getById(tenantId: string, workId: string) {
    const work = await this.findWorkOrFail(tenantId, workId);
    const [responses, taskCompletions, annotations, findingCandidates] =
      await Promise.all([
        this.responses.find({ where: { tenantId, workId } }),
        this.taskCompletions.find({ where: { tenantId, workId } }),
        this.annotations.find({ where: { tenantId, workId } }),
        this.findingCandidates.find({ where: { tenantId, workId } }),
      ]);
    return {
      work: this.toPublicWork(work),
      snapshot: work.formSnapshot,
      responses,
      taskCompletions,
      annotations,
      findingCandidates,
    };
  }

  async create(
    tenantId: string,
    siteId: string,
    assetId: string,
    dto: CreateWorkDto
  ) {
    if (![WorkStatus.DRAFT, WorkStatus.IN_PROGRESS].includes(dto.status)) {
      throw new BadRequestException(
        'A work must start as DRAFT or IN_PROGRESS'
      );
    }
    const [asset, effectiveWorkTypes] = await Promise.all([
      this.catalog.getAsset(tenantId, siteId, assetId),
      this.catalog.listEffectiveWorkTypes(tenantId, siteId, assetId),
    ]);
    if (
      !effectiveWorkTypes.some((workType) => workType.id === dto.workTypeId)
    ) {
      throw new BadRequestException('Work type is not enabled for this asset');
    }
    const template = await this.templates.findOne({
      where: {
        tenantId,
        workTypeId: dto.workTypeId,
        active: true,
      },
    });
    if (!template) {
      throw new NotFoundException(
        'Active form template not found for work type'
      );
    }

    const id = randomUUID();
    const snapshot = await this.buildSnapshot(id, tenantId, asset, template);
    const work = this.works.create({
      id,
      tenantId,
      siteId: asset.siteId,
      assetId: asset.id,
      workTypeId: dto.workTypeId,
      formTemplateId: template.id,
      formTemplateVersion: template.version,
      title: dto.title.trim(),
      executionDate: dto.executionDate.slice(0, 10),
      responsible: dto.responsible.trim(),
      company: dto.company?.trim() || null,
      status: dto.status,
      notes: dto.notes?.trim() || null,
      formSnapshot: snapshot,
    });
    return {
      work: this.toPublicWork(await this.works.save(work)),
      snapshot,
    };
  }

  async prepareSnapshotForSyncedWork(
    tenantId: string,
    workId: string,
    siteId: string,
    assetId: string,
    workTypeId: string,
    formTemplateId: string,
    formTemplateVersion: number
  ) {
    const [asset, effectiveWorkTypes, template] = await Promise.all([
      this.catalog.getAsset(tenantId, siteId, assetId),
      this.catalog.listEffectiveWorkTypes(tenantId, siteId, assetId),
      this.templates.findOne({
        where: {
          id: formTemplateId,
          tenantId,
          workTypeId,
          version: formTemplateVersion,
          active: true,
        },
      }),
    ]);
    if (!effectiveWorkTypes.some((workType) => workType.id === workTypeId)) {
      throw new BadRequestException('Work type is not enabled for this asset');
    }
    if (!template) {
      throw new BadRequestException(
        'The offline work template is no longer active or has changed version'
      );
    }
    return {
      asset,
      snapshot: await this.buildSnapshot(workId, tenantId, asset, template),
    };
  }

  async saveResponses(
    tenantId: string,
    workId: string,
    dto: SaveWorkResponsesDto
  ) {
    const work = await this.findWorkOrFail(tenantId, workId);
    this.assertEditable(work);
    const normalized = this.validateAndNormalize(work.formSnapshot, dto);
    await this.replaceResponses(work, normalized);
    await this.works.update(
      { id: workId, tenantId },
      { updatedAt: new Date() }
    );
    return this.getById(tenantId, workId);
  }

  async updateStatus(tenantId: string, workId: string, status: WorkStatus) {
    const work = await this.findWorkOrFail(tenantId, workId);
    if (work.status !== WorkStatus.DRAFT || status !== WorkStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Only the DRAFT to IN_PROGRESS transition is available'
      );
    }
    work.status = WorkStatus.IN_PROGRESS;
    return this.toPublicWork(await this.works.save(work));
  }

  async finish(tenantId: string, workId: string, dto: SaveWorkResponsesDto) {
    const work = await this.findWorkOrFail(tenantId, workId);
    if (work.status !== WorkStatus.IN_PROGRESS) {
      throw new BadRequestException('The work must be IN_PROGRESS to finish');
    }
    const normalized = this.validateAndNormalize(work.formSnapshot, dto);
    await this.replaceResponses(work, normalized);
    await this.works.update(
      { id: workId, tenantId },
      { updatedAt: new Date() }
    );
    const completedItemIds = new Set([
      ...normalized.responses.map((response) => response.formItemId),
      ...normalized.taskCompletions
        .filter((completion) => completion.completed)
        .map((completion) => completion.formItemId),
    ]);
    const missingLabels = work.formSnapshot.sections.flatMap((section) =>
      section.items
        .filter(
          (item) =>
            item.required &&
            (item.type === FormItemType.TASK ||
              item.concept?.type !== ConceptType.HIDDEN) &&
            !completedItemIds.has(item.id)
        )
        .map((item) => item.concept?.name ?? item.title ?? 'Required field')
    );
    if (missingLabels.length > 0) {
      throw new BadRequestException({
        message: `Faltan ${missingLabels.length} campos obligatorios.`,
        missingLabels,
      });
    }
    work.status = WorkStatus.FINISHED;
    return this.toPublicWork(await this.works.save(work));
  }

  private async replaceResponses(
    work: WorkEntity,
    dto: NormalizedWorkResponses
  ) {
    const { tenantId, id: workId } = work;
    await this.dataSource.transaction(async (manager) => {
      const responseRepository = manager.getRepository(ConceptResponseEntity);
      const taskRepository = manager.getRepository(TaskCompletionEntity);
      const annotationRepository = manager.getRepository(
        WorkItemAnnotationEntity
      );
      const [existingResponses, existingTasks, existingAnnotations] =
        await Promise.all([
          responseRepository.find({ where: { tenantId, workId } }),
          taskRepository.find({ where: { tenantId, workId } }),
          annotationRepository.find({ where: { tenantId, workId } }),
        ]);
      const responseByItem = new Map(
        existingResponses.map((item) => [item.formItemId, item])
      );
      const taskByItem = new Map(
        existingTasks.map((item) => [item.formItemId, item])
      );
      const annotationByItem = new Map(
        existingAnnotations.map((item) => [item.formItemId, item])
      );
      await Promise.all([
        responseRepository.delete({ tenantId, workId }),
        taskRepository.delete({ tenantId, workId }),
        annotationRepository.delete({ tenantId, workId }),
      ]);
      if (dto.responses.length > 0) {
        await responseRepository.save(
          dto.responses.map((value) => {
            const previous = responseByItem.get(value.formItemId);
            return responseRepository.create({
              id: previous?.id,
              tenantId,
              workId,
              formItemId: value.formItemId,
              conceptId: value.conceptId,
              valueNumber: value.valueNumber ?? null,
              valueText: value.valueText ?? null,
              selectedOptionId: value.selectedOptionId ?? null,
              createdAt: previous?.createdAt,
            });
          })
        );
      }
      if (dto.taskCompletions.length > 0) {
        await taskRepository.save(
          dto.taskCompletions.map((value) => {
            const previous = taskByItem.get(value.formItemId);
            return taskRepository.create({
              id: previous?.id,
              tenantId,
              workId,
              formItemId: value.formItemId,
              completed: value.completed,
              createdAt: previous?.createdAt,
            });
          })
        );
      }
      if (dto.annotations.length > 0) {
        await annotationRepository.save(
          dto.annotations.map((value) => {
            const previous = annotationByItem.get(value.formItemId);
            return annotationRepository.create({
              id: previous?.id,
              tenantId,
              workId,
              formItemId: value.formItemId,
              comment: value.comment,
              isFinding: value.isFinding ?? false,
              createdAt: previous?.createdAt,
            });
          })
        );
      }
      await this.findingCandidateService.reconcile(manager, work);
    });
  }

  private validateAndNormalize(
    snapshot: WorkTemplateSnapshot,
    dto: SaveWorkResponsesDto
  ): NormalizedWorkResponses {
    const items = new Map(
      snapshot.sections.flatMap((section) =>
        section.items.map((item) => [item.id, item] as const)
      )
    );
    this.assertUniqueItemIds(dto.responses, 'response');
    this.assertUniqueItemIds(dto.taskCompletions, 'task completion');
    this.assertUniqueItemIds(dto.annotations, 'annotation');
    const responses = dto.responses.map((value) => {
      const item = items.get(value.formItemId);
      if (item?.type !== FormItemType.CONCEPT || !item.concept) {
        throw new BadRequestException(
          'Response item is not a concept in the snapshot'
        );
      }
      const normalized = this.normalizeConceptValue(item, value);
      return { ...normalized, conceptId: item.concept.id };
    });
    const taskCompletions = dto.taskCompletions.map((value) => {
      const item = items.get(value.formItemId);
      if (item?.type !== FormItemType.TASK) {
        throw new BadRequestException(
          'Completion item is not a task in the snapshot'
        );
      }
      return value;
    });
    const annotations = dto.annotations.flatMap((value) => {
      if (!items.has(value.formItemId)) {
        throw new BadRequestException(
          'Annotation item is not present in the work snapshot'
        );
      }
      const comment = value.comment.trim();
      if (value.isFinding && !comment)
        throw new BadRequestException('A manual finding needs a comment');
      return comment
        ? [
            {
              formItemId: value.formItemId,
              comment,
              isFinding: value.isFinding ?? false,
            },
          ]
        : [];
    });
    return { responses, taskCompletions, annotations };
  }

  private normalizeConceptValue(
    item: WorkFormItemSnapshot,
    value: ConceptResponseValueDto
  ): ConceptResponseValueDto {
    const concept = item.concept;
    if (!concept) throw new BadRequestException('Snapshot concept is missing');
    if (
      concept.type === ConceptType.ANALOG &&
      value.valueNumber !== undefined
    ) {
      return { formItemId: item.id, valueNumber: value.valueNumber };
    }
    if (concept.type === ConceptType.TEXT && value.valueText?.trim()) {
      return { formItemId: item.id, valueText: value.valueText.trim() };
    }
    if (
      concept.type === ConceptType.DIGITAL &&
      value.selectedOptionId &&
      concept.options.some((option) => option.id === value.selectedOptionId)
    ) {
      return { formItemId: item.id, selectedOptionId: value.selectedOptionId };
    }
    throw new BadRequestException(
      `Response value does not match concept type ${concept.type}`
    );
  }

  private assertUniqueItemIds(
    values: Array<
      | ConceptResponseValueDto
      | TaskCompletionValueDto
      | WorkItemAnnotationValueDto
    >,
    label: string
  ) {
    const ids = values.map((value) => value.formItemId);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException(`Duplicate ${label} item`);
    }
  }

  private assertEditable(work: WorkEntity) {
    if ([WorkStatus.FINISHED, WorkStatus.REVIEWED].includes(work.status)) {
      throw new BadRequestException('Closed works cannot be edited');
    }
  }

  private async findWorkOrFail(tenantId: string, workId: string) {
    const work = await this.works.findOne({ where: { id: workId, tenantId } });
    if (!work) throw new NotFoundException('Work not found in this tenant');
    return work;
  }

  private async buildSnapshot(
    workId: string,
    tenantId: string,
    rootAsset: AssetEntity,
    template: FormTemplateEntity
  ): Promise<WorkTemplateSnapshot> {
    const sections = await this.sections.find({
      where: { tenantId, formTemplateId: template.id },
      order: { order: 'ASC' },
    });
    const allItems = await this.items.find({ where: { tenantId } });
    const templateItems = allItems.filter((item) =>
      sections.some((section) => section.id === item.sectionId)
    );
    const conceptIds = templateItems.flatMap((item) =>
      item.conceptId ? [item.conceptId] : []
    );
    const [concepts, options, descendants, assetTypeConcepts] =
      await Promise.all([
        this.concepts.find({ where: { tenantId } }),
        this.options.find({ where: { tenantId }, order: { order: 'ASC' } }),
        this.catalog.getAssetDescendants(
          tenantId,
          rootAsset.siteId,
          rootAsset.id
        ),
        this.catalog.listAssetTypeConcepts(tenantId),
      ]);
    const conceptById = new Map(
      concepts
        .filter((concept) => conceptIds.includes(concept.id))
        .map((concept) => [concept.id, concept])
    );
    const assets = [rootAsset, ...descendants];
    const assetOrder = new Map(assets.map((asset, index) => [asset.id, index]));
    const assetDepth = new Map<string, number>([[rootAsset.id, 0]]);
    for (const asset of descendants) {
      assetDepth.set(asset.id, (assetDepth.get(asset.parentId ?? '') ?? 0) + 1);
    }
    const allowedConcepts = new Set(
      assetTypeConcepts
        .filter((relation) => relation.active)
        .map((relation) => `${relation.assetTypeId}:${relation.conceptId}`)
    );
    const snapshotAsset = (asset: AssetEntity) => ({
      assetId: asset.id,
      assetCodeSnapshot: asset.code,
      assetNameSnapshot: asset.name,
      assetTypeIdSnapshot: asset.assetTypeId,
      assetOrder: assetOrder.get(asset.id) ?? 0,
      assetDepth: assetDepth.get(asset.id) ?? 0,
    });
    const conceptSnapshot = (concept: ConceptEntity) => ({
      id: concept.id,
      code: concept.code,
      name: concept.name,
      description: concept.description,
      type: concept.type,
      unit: concept.unit,
      minValue: concept.minValue ?? null,
      maxValue: concept.maxValue ?? null,
      outOfRangeSeverityId: concept.outOfRangeSeverityId ?? null,
      options: options
        .filter((option) => option.conceptId === concept.id && option.active)
        .map(
          ({
            id,
            label,
            value,
            order,
            generatesFinding,
            suggestedSeverityId,
          }) => ({
            id,
            label,
            value,
            order,
            generatesFinding,
            suggestedSeverityId: suggestedSeverityId ?? null,
          })
        ),
    });
    return {
      workId,
      tenantId,
      formTemplateId: template.id,
      formTemplateVersion: template.version,
      name: template.name,
      sections: sections.map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        order: section.order,
        items: templateItems
          .filter((item) => item.sectionId === section.id)
          .sort((a, b) => a.order - b.order)
          .flatMap((item) => {
            const concept = item.conceptId
              ? conceptById.get(item.conceptId)
              : undefined;
            const targetAssets =
              item.type === FormItemType.TASK
                ? [rootAsset]
                : concept
                ? assets.filter((asset) =>
                    allowedConcepts.has(`${asset.assetTypeId}:${concept.id}`)
                  )
                : [];
            return targetAssets.map((asset) => ({
              id: workItemInstanceId(workId, asset.id, item.id),
              formItemId: item.id,
              ...snapshotAsset(asset),
              type: item.type,
              order: item.order,
              title: item.title,
              description: item.description,
              required: item.required,
              concept: concept ? conceptSnapshot(concept) : undefined,
            }));
          }),
      })),
    };
  }

  private toPublicWork(work: WorkEntity) {
    return {
      id: work.id,
      tenantId: work.tenantId,
      siteId: work.siteId,
      assetId: work.assetId,
      workTypeId: work.workTypeId,
      formTemplateId: work.formTemplateId,
      formTemplateVersion: work.formTemplateVersion,
      title: work.title,
      executionDate: work.executionDate,
      responsible: work.responsible,
      company: work.company,
      status: work.status,
      notes: work.notes,
      createdAt: work.createdAt,
      updatedAt: work.updatedAt,
    };
  }
}
