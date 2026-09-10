import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ConceptEntity } from '../catalog/entities/concept.entity';
import { TenantEntity } from '../catalog/entities/tenant.entity';
import { WorkTypeEntity } from '../catalog/entities/work-type.entity';
import { FormItemEntity, FormItemType } from './entities/form-item.entity';
import { FormSectionEntity } from './entities/form-section.entity';
import { FormTemplateEntity } from './entities/form-template.entity';
import { FormTemplatesService } from './form-templates.service';

describe('FormTemplatesService', () => {
  const tenantId = 'f1ee65d1-95bc-5ae4-95d5-f8fb3818f737';
  const workTypeId = '2cc9f8a4-8a68-5cd8-91b7-88dfc07cd4ea';
  const templateId = 'bcfc0a99-cfe4-45d2-9b2e-a7ed0504fb39';
  const sectionId = 'cc9aa544-bccb-4934-951b-67dd9c355b53';
  const conceptId = '7bc82434-a111-4db6-b37e-f771945cadde';
  let tenants: jest.Mocked<Pick<Repository<TenantEntity>, 'exist'>>;
  let workTypes: jest.Mocked<Pick<Repository<WorkTypeEntity>, 'findOne'>>;
  let concepts: jest.Mocked<Pick<Repository<ConceptEntity>, 'findOne'>>;
  let templates: jest.Mocked<
    Pick<
      Repository<FormTemplateEntity>,
      'find' | 'findOne' | 'exist' | 'create' | 'save'
    >
  >;
  let sections: jest.Mocked<
    Pick<
      Repository<FormSectionEntity>,
      'find' | 'findOne' | 'count' | 'create' | 'save'
    >
  >;
  let items: jest.Mocked<
    Pick<
      Repository<FormItemEntity>,
      'find' | 'findOne' | 'count' | 'create' | 'save'
    >
  >;
  let service: FormTemplatesService;

  beforeEach(() => {
    tenants = { exist: jest.fn() };
    workTypes = { findOne: jest.fn() };
    concepts = { findOne: jest.fn() };
    templates = {
      find: jest.fn(),
      findOne: jest.fn(),
      exist: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    sections = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    items = {
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    service = new FormTemplatesService(
      tenants as unknown as Repository<TenantEntity>,
      workTypes as unknown as Repository<WorkTypeEntity>,
      concepts as unknown as Repository<ConceptEntity>,
      templates as unknown as Repository<FormTemplateEntity>,
      sections as unknown as Repository<FormSectionEntity>,
      items as unknown as Repository<FormItemEntity>,
      {} as DataSource
    );
  });

  it('lists templates, sections and items only for the requested tenant', async () => {
    tenants.exist.mockResolvedValue(true);
    templates.find.mockResolvedValue([]);
    sections.find.mockResolvedValue([]);
    items.find.mockResolvedValue([]);

    await expect(service.listCatalog(tenantId)).resolves.toEqual({
      templates: [],
      sections: [],
      items: [],
    });
    expect(templates.find).toHaveBeenCalledWith({
      where: { tenantId },
      order: { name: 'ASC' },
    });
    expect(sections.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId } })
    );
    expect(items.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId } })
    );
  });

  it('rejects a template for a work type from another tenant', async () => {
    tenants.exist.mockResolvedValue(true);
    workTypes.findOne.mockResolvedValue(null);

    await expect(
      service.createTemplate(tenantId, workTypeId, {
        name: 'Formulario',
        active: true,
      })
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(templates.save).not.toHaveBeenCalled();
  });

  it('allows only one template for a work type in this phase', async () => {
    tenants.exist.mockResolvedValue(true);
    workTypes.findOne.mockResolvedValue({
      id: workTypeId,
      tenantId,
    } as WorkTypeEntity);
    templates.exist.mockResolvedValue(true);

    await expect(
      service.createTemplate(tenantId, workTypeId, {
        name: 'Formulario duplicado',
      })
    ).rejects.toBeInstanceOf(ConflictException);
    expect(templates.create).not.toHaveBeenCalled();
  });

  it('rejects a concept item when the concept is outside the tenant', async () => {
    sections.findOne.mockResolvedValue({
      id: sectionId,
      tenantId,
      formTemplateId: templateId,
    } as FormSectionEntity);
    concepts.findOne.mockResolvedValue(null);

    await expect(
      service.createItem(tenantId, sectionId, {
        type: FormItemType.CONCEPT,
        conceptId,
        required: true,
      })
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(items.save).not.toHaveBeenCalled();
  });

  it('stores a task without a concept reference', async () => {
    sections.findOne.mockResolvedValue({
      id: sectionId,
      tenantId,
      formTemplateId: templateId,
    } as FormSectionEntity);
    items.count.mockResolvedValue(1);
    const created = {
      id: 'f1262227-7ed7-409a-a031-9d19456b3f21',
      tenantId,
      sectionId,
      type: FormItemType.TASK,
      order: 2,
      title: 'Revisar gabinete',
      description: null,
      conceptId: null,
      required: true,
    } as FormItemEntity;
    items.create.mockReturnValue(created);
    items.save.mockResolvedValue(created);

    await expect(
      service.createItem(tenantId, sectionId, {
        type: FormItemType.TASK,
        title: ' Revisar gabinete ',
        required: true,
      })
    ).resolves.toBe(created);
    expect(items.create).toHaveBeenCalledWith({
      tenantId,
      sectionId,
      type: FormItemType.TASK,
      order: 2,
      title: 'Revisar gabinete',
      description: null,
      conceptId: null,
      required: true,
    });
  });
});
