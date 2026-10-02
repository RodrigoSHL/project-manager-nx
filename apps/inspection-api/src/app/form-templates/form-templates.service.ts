import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { ConceptEntity } from '../catalog/entities/concept.entity';
import { TenantEntity } from '../catalog/entities/tenant.entity';
import { WorkTypeEntity } from '../catalog/entities/work-type.entity';
import { CreateFormItemDto } from './dto/create-form-item.dto';
import { CreateFormSectionDto } from './dto/create-form-section.dto';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormItemDto } from './dto/update-form-item.dto';
import { UpdateFormSectionDto } from './dto/update-form-section.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';
import { FormItemEntity, FormItemType } from './entities/form-item.entity';
import { FormSectionEntity } from './entities/form-section.entity';
import { FormTemplateEntity } from './entities/form-template.entity';

@Injectable()
export class FormTemplatesService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
    @InjectRepository(WorkTypeEntity)
    private readonly workTypes: Repository<WorkTypeEntity>,
    @InjectRepository(ConceptEntity)
    private readonly concepts: Repository<ConceptEntity>,
    @InjectRepository(FormTemplateEntity)
    private readonly templates: Repository<FormTemplateEntity>,
    @InjectRepository(FormSectionEntity)
    private readonly sections: Repository<FormSectionEntity>,
    @InjectRepository(FormItemEntity)
    private readonly items: Repository<FormItemEntity>,
    private readonly dataSource: DataSource
  ) {}

  async listCatalog(tenantId: string) {
    await this.assertTenantExists(tenantId);
    const [templates, sections, items] = await Promise.all([
      this.templates.find({ where: { tenantId }, order: { name: 'ASC' } }),
      this.sections.find({
        where: { tenantId },
        order: { formTemplateId: 'ASC', order: 'ASC' },
      }),
      this.items.find({
        where: { tenantId },
        order: { sectionId: 'ASC', order: 'ASC' },
      }),
    ]);
    return { templates, sections, items };
  }

  async createTemplate(
    tenantId: string,
    workTypeId: string,
    dto: CreateFormTemplateDto
  ) {
    await this.assertTenantExists(tenantId);
    await this.findWorkTypeOrFail(tenantId, workTypeId);
    if (await this.templates.exist({ where: { tenantId, workTypeId } })) {
      throw new ConflictException('This work type already has a form template');
    }
    const template = this.templates.create({
      tenantId,
      workTypeId,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      version: 1,
      active: dto.active ?? true,
    });
    return this.save(this.templates, template);
  }

  async updateTemplate(
    tenantId: string,
    templateId: string,
    dto: UpdateFormTemplateDto
  ) {
    const template = await this.findTemplateOrFail(tenantId, templateId);
    Object.assign(template, {
      name: dto.name === undefined ? template.name : dto.name.trim(),
      description:
        dto.description === undefined
          ? template.description
          : dto.description?.trim() || null,
      active: dto.active ?? template.active,
    });
    return this.save(this.templates, template);
  }

  async createSection(
    tenantId: string,
    templateId: string,
    dto: CreateFormSectionDto
  ) {
    await this.findTemplateOrFail(tenantId, templateId);
    const order =
      (await this.sections.count({
        where: { tenantId, formTemplateId: templateId },
      })) + 1;
    const section = this.sections.create({
      tenantId,
      formTemplateId: templateId,
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      order,
    });
    return this.save(this.sections, section);
  }

  async updateSection(
    tenantId: string,
    sectionId: string,
    dto: UpdateFormSectionDto
  ) {
    const section = await this.findSectionOrFail(tenantId, sectionId);
    Object.assign(section, {
      title: dto.title === undefined ? section.title : dto.title.trim(),
      description:
        dto.description === undefined
          ? section.description
          : dto.description?.trim() || null,
    });
    return this.save(this.sections, section);
  }

  async deleteSection(tenantId: string, sectionId: string) {
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(FormSectionEntity);
      const section = await this.findSectionOrFail(
        tenantId,
        sectionId,
        repository
      );
      await repository.remove(section);
      await this.normalizeSectionOrders(
        manager,
        tenantId,
        section.formTemplateId
      );
    });
    return { id: sectionId, deleted: true };
  }

  async reorderSections(
    tenantId: string,
    templateId: string,
    orderedIds: string[]
  ) {
    await this.findTemplateOrFail(tenantId, templateId);
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(FormSectionEntity);
      const sections = await repository.find({
        where: { tenantId, formTemplateId: templateId },
        order: { order: 'ASC' },
      });
      this.assertExactOrder(
        orderedIds,
        sections.map((item) => item.id)
      );
      await this.persistOrder(repository, sections, orderedIds, tenantId);
      return repository.find({
        where: { tenantId, formTemplateId: templateId },
        order: { order: 'ASC' },
      });
    });
  }

  async createItem(
    tenantId: string,
    sectionId: string,
    dto: CreateFormItemDto
  ) {
    await this.findSectionOrFail(tenantId, sectionId);
    const content = await this.normalizeItemContent(tenantId, dto);
    const order =
      (await this.items.count({ where: { tenantId, sectionId } })) + 1;
    const item = this.items.create({
      tenantId,
      sectionId,
      order,
      required: dto.required,
      description: dto.description?.trim() || null,
      ...content,
    });
    return this.save(this.items, item);
  }

  async updateItem(tenantId: string, itemId: string, dto: UpdateFormItemDto) {
    const item = await this.findItemOrFail(tenantId, itemId);
    const type = dto.type ?? item.type;
    const content = await this.normalizeItemContent(tenantId, {
      type,
      title:
        dto.title === undefined
          ? type === FormItemType.TASK
            ? item.title
            : null
          : dto.title,
      conceptId:
        dto.conceptId === undefined
          ? type === FormItemType.CONCEPT
            ? item.conceptId
            : null
          : dto.conceptId,
    });
    Object.assign(item, {
      ...content,
      description:
        dto.description === undefined
          ? item.description
          : dto.description?.trim() || null,
      required: dto.required ?? item.required,
    });
    return this.save(this.items, item);
  }

  async deleteItem(tenantId: string, itemId: string) {
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(FormItemEntity);
      const item = await this.findItemOrFail(tenantId, itemId, repository);
      await repository.remove(item);
      await this.normalizeItemOrders(manager, tenantId, item.sectionId);
    });
    return { id: itemId, deleted: true };
  }

  async reorderItems(
    tenantId: string,
    sectionId: string,
    orderedIds: string[]
  ) {
    await this.findSectionOrFail(tenantId, sectionId);
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(FormItemEntity);
      const items = await repository.find({
        where: { tenantId, sectionId },
        order: { order: 'ASC' },
      });
      this.assertExactOrder(
        orderedIds,
        items.map((item) => item.id)
      );
      await this.persistOrder(repository, items, orderedIds, tenantId);
      return repository.find({
        where: { tenantId, sectionId },
        order: { order: 'ASC' },
      });
    });
  }

  private async normalizeItemContent(
    tenantId: string,
    dto: Pick<CreateFormItemDto, 'type' | 'title' | 'conceptId'>
  ) {
    if (dto.type === FormItemType.TASK) {
      const title = dto.title?.trim();
      if (!title) throw new BadRequestException('A task requires a title');
      return { type: dto.type, title, conceptId: null };
    }
    if (!dto.conceptId) {
      throw new BadRequestException('A concept item requires a conceptId');
    }
    const concept = await this.concepts.findOne({
      where: { id: dto.conceptId, tenantId, active: true },
    });
    if (!concept) {
      throw new NotFoundException('Active concept not found in this tenant');
    }
    return { type: dto.type, title: null, conceptId: concept.id };
  }

  private async normalizeSectionOrders(
    manager: EntityManager,
    tenantId: string,
    templateId: string
  ) {
    const repository = manager.getRepository(FormSectionEntity);
    const sections = await repository.find({
      where: { tenantId, formTemplateId: templateId },
      order: { order: 'ASC' },
    });
    for (const [index, section] of sections.entries()) {
      const nextOrder = index + 1;
      if (section.order !== nextOrder) {
        await repository.update(
          { id: section.id, tenantId },
          { order: nextOrder }
        );
      }
    }
  }

  private async normalizeItemOrders(
    manager: EntityManager,
    tenantId: string,
    sectionId: string
  ) {
    const repository = manager.getRepository(FormItemEntity);
    const items = await repository.find({
      where: { tenantId, sectionId },
      order: { order: 'ASC' },
    });
    for (const [index, item] of items.entries()) {
      const nextOrder = index + 1;
      if (item.order !== nextOrder) {
        await repository.update(
          { id: item.id, tenantId },
          { order: nextOrder }
        );
      }
    }
  }

  private async persistOrder<T extends { id: string; order: number }>(
    repository: Repository<T>,
    items: T[],
    orderedIds: string[],
    tenantId: string
  ) {
    const offset = items.length + 1000;
    for (const item of items) {
      await repository.update(
        { id: item.id, tenantId } as never,
        { order: item.order + offset } as never
      );
    }
    for (const [index, id] of orderedIds.entries()) {
      await repository.update(
        { id, tenantId } as never,
        { order: index + 1 } as never
      );
    }
  }

  private assertExactOrder(orderedIds: string[], existingIds: string[]) {
    const uniqueIds = new Set(orderedIds);
    if (
      orderedIds.length !== existingIds.length ||
      uniqueIds.size !== orderedIds.length ||
      existingIds.some((id) => !uniqueIds.has(id))
    ) {
      throw new BadRequestException(
        'The order must contain every item in the same container exactly once'
      );
    }
  }

  private async assertTenantExists(tenantId: string) {
    if (!(await this.tenants.exist({ where: { id: tenantId } }))) {
      throw new NotFoundException('Tenant not found');
    }
  }

  private async findWorkTypeOrFail(tenantId: string, workTypeId: string) {
    const workType = await this.workTypes.findOne({
      where: { id: workTypeId, tenantId },
    });
    if (!workType)
      throw new NotFoundException('Work type not found in this tenant');
    return workType;
  }

  private async findTemplateOrFail(tenantId: string, templateId: string) {
    const template = await this.templates.findOne({
      where: { id: templateId, tenantId },
    });
    if (!template)
      throw new NotFoundException('Form template not found in this tenant');
    return template;
  }

  private async findSectionOrFail(
    tenantId: string,
    sectionId: string,
    repository = this.sections
  ) {
    const section = await repository.findOne({
      where: { id: sectionId, tenantId },
    });
    if (!section)
      throw new NotFoundException('Form section not found in this tenant');
    return section;
  }

  private async findItemOrFail(
    tenantId: string,
    itemId: string,
    repository = this.items
  ) {
    const item = await repository.findOne({ where: { id: itemId, tenantId } });
    if (!item)
      throw new NotFoundException('Form item not found in this tenant');
    return item;
  }

  private async save<T extends object>(repository: Repository<T>, entity: T) {
    try {
      return await repository.save(entity);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('Form configuration already exists');
      }
      throw error;
    }
  }
}
