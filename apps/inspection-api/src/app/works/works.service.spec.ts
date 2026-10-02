import { BadRequestException } from '@nestjs/common';
import type { DataSource, EntityManager, Repository } from 'typeorm';
import type { CatalogService } from '../catalog/catalog.service';
import { ConceptType } from '../catalog/entities/concept.entity';
import { FormItemType } from '../form-templates/entities/form-item.entity';
import type { FormTemplateEntity } from '../form-templates/entities/form-template.entity';
import type { ConceptResponseEntity } from './entities/concept-response.entity';
import type { TaskCompletionEntity } from './entities/task-completion.entity';
import type { WorkItemAnnotationEntity } from './entities/work-item-annotation.entity';
import { WorkEntity, WorkStatus } from './entities/work.entity';
import { WorksService } from './works.service';

describe('WorksService', () => {
  const tenantId = 'f1ee65d1-95bc-5ae4-95d5-f8fb3818f737';
  const workId = '53f9b928-7db8-45c8-a349-c98aa25c078d';
  let works: jest.Mocked<
    Pick<Repository<WorkEntity>, 'findOne' | 'save' | 'create' | 'update'>
  >;
  let annotationRepository: {
    find: jest.Mock;
    delete: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let responseRepository: {
    find: jest.Mock;
    delete: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let catalog: {
    getAsset: jest.Mock;
    getAssetDescendants: jest.Mock;
    listAssetTypeConcepts: jest.Mock;
    listEffectiveWorkTypes: jest.Mock;
    listSites: jest.Mock;
  };
  let templates: { findOne: jest.Mock };
  let sections: { find: jest.Mock };
  let items: { find: jest.Mock };
  let concepts: { find: jest.Mock };
  let options: { find: jest.Mock };
  let service: WorksService;

  beforeEach(() => {
    works = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      update: jest
        .fn()
        .mockResolvedValue({ affected: 1, raw: [], generatedMaps: [] }),
    };
    responseRepository = {
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({}),
      save: jest.fn().mockResolvedValue([]),
      create: jest.fn((value) => value),
    };
    const taskRepository = {
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({}),
      save: jest.fn().mockResolvedValue([]),
      create: jest.fn((value) => value),
    };
    annotationRepository = {
      find: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({}),
      save: jest.fn().mockResolvedValue([]),
      create: jest.fn((value) => value),
    };
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity.name === 'ConceptResponseEntity') return responseRepository;
        if (entity.name === 'TaskCompletionEntity') return taskRepository;
        return annotationRepository;
      }),
    } as unknown as EntityManager;
    const dataSource = {
      transaction: jest.fn(async (action) => action(manager)),
      getRepository: jest.fn(() => ({ find: jest.fn().mockResolvedValue([]) })),
    } as unknown as DataSource;
    catalog = {
      getAsset: jest.fn(),
      getAssetDescendants: jest.fn().mockResolvedValue([]),
      listAssetTypeConcepts: jest.fn().mockResolvedValue([]),
      listEffectiveWorkTypes: jest.fn(),
      listSites: jest.fn(),
    };
    templates = { findOne: jest.fn() };
    sections = { find: jest.fn().mockResolvedValue([]) };
    items = { find: jest.fn().mockResolvedValue([]) };
    concepts = { find: jest.fn().mockResolvedValue([]) };
    options = { find: jest.fn().mockResolvedValue([]) };
    service = new WorksService(
      catalog as unknown as CatalogService,
      works as unknown as Repository<WorkEntity>,
      responseRepository as unknown as Repository<ConceptResponseEntity>,
      taskRepository as unknown as Repository<TaskCompletionEntity>,
      annotationRepository as unknown as Repository<WorkItemAnnotationEntity>,
      templates as unknown as Repository<FormTemplateEntity>,
      sections as never,
      items as never,
      concepts as never,
      options as never,
      { find: jest.fn().mockResolvedValue([]) } as never,
      dataSource,
      { reconcile: jest.fn().mockResolvedValue(undefined) } as never
    );
  });

  it('materializes template concepts only for matching assets in the full subtree', async () => {
    const rootAsset = {
      id: 'asset-root',
      tenantId,
      siteId: 'site-a',
      assetTypeId: 'transformer-type',
      code: 'T1',
      name: 'Transformador T1',
      parentId: null,
    };
    catalog.getAsset.mockResolvedValue(rootAsset);
    catalog.listEffectiveWorkTypes.mockResolvedValue([
      { id: 'work-type-visual' },
    ]);
    catalog.getAssetDescendants.mockResolvedValue([
      {
        ...rootAsset,
        id: 'radiator-r1',
        assetTypeId: 'radiator-type',
        code: 'R1',
        name: 'Radiador R1',
        parentId: rootAsset.id,
      },
      {
        ...rootAsset,
        id: 'bushing-b1',
        assetTypeId: 'bushing-type',
        code: 'B1',
        name: 'Bushing B1',
        parentId: 'radiator-r1',
      },
      {
        ...rootAsset,
        id: 'fan-v1',
        assetTypeId: 'fan-type',
        code: 'V1',
        name: 'Ventilador V1',
        parentId: rootAsset.id,
      },
    ]);
    catalog.listAssetTypeConcepts.mockResolvedValue([
      {
        assetTypeId: 'transformer-type',
        conceptId: 'concept-temperature',
        active: true,
      },
      {
        assetTypeId: 'radiator-type',
        conceptId: 'concept-temperature',
        active: true,
      },
      {
        assetTypeId: 'bushing-type',
        conceptId: 'concept-temperature',
        active: true,
      },
      {
        assetTypeId: 'fan-type',
        conceptId: 'concept-current',
        active: true,
      },
    ]);
    templates.findOne.mockResolvedValue({
      id: 'template-visual',
      tenantId,
      workTypeId: 'work-type-visual',
      version: 1,
      name: 'Inspección visual',
      active: true,
    });
    sections.find.mockResolvedValue([
      {
        id: 'section-a',
        title: 'Estado',
        order: 1,
      },
    ]);
    items.find.mockResolvedValue([
      {
        id: 'form-item-temperature',
        sectionId: 'section-a',
        type: FormItemType.CONCEPT,
        conceptId: 'concept-temperature',
        order: 1,
        required: true,
      },
      {
        id: 'form-item-task',
        sectionId: 'section-a',
        type: FormItemType.TASK,
        title: 'Verificar acceso',
        order: 2,
        required: true,
      },
    ]);
    concepts.find.mockResolvedValue([
      {
        id: 'concept-temperature',
        code: 'TEMPERATURE',
        name: 'Temperatura',
        type: ConceptType.ANALOG,
        unit: '°C',
      },
      {
        id: 'concept-current',
        code: 'CURRENT',
        name: 'Corriente',
        type: ConceptType.ANALOG,
        unit: 'A',
      },
    ]);
    works.create.mockImplementation((value) => value as WorkEntity);
    works.save.mockImplementation(async (value) => ({
      ...(value as WorkEntity),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await service.create(
      tenantId,
      rootAsset.siteId,
      rootAsset.id,
      {
        workTypeId: 'work-type-visual',
        title: 'Inspección T1',
        executionDate: '2026-09-25',
        responsible: 'Inspector',
        status: WorkStatus.DRAFT,
      }
    );
    const snapshotItems = result.snapshot.sections.flatMap(
      (section) => section.items
    );
    const temperatureItems = snapshotItems.filter(
      (item) => item.concept?.id === 'concept-temperature'
    );

    expect(temperatureItems.map((item) => item.assetId)).toEqual([
      rootAsset.id,
      'radiator-r1',
      'bushing-b1',
    ]);
    expect(new Set(temperatureItems.map((item) => item.id)).size).toBe(3);
    expect(
      snapshotItems.filter((item) => item.type === FormItemType.TASK)
    ).toEqual([expect.objectContaining({ assetId: rootAsset.id })]);
    expect(snapshotItems.some((item) => item.assetId === 'fan-v1')).toBe(false);
    expect(result.work.assetId).toBe(rootAsset.id);
    expect(catalog.listEffectiveWorkTypes).toHaveBeenCalledTimes(1);
    expect(catalog.listEffectiveWorkTypes).toHaveBeenCalledWith(
      tenantId,
      rootAsset.siteId,
      rootAsset.id
    );
  });

  it('allows only the DRAFT to IN_PROGRESS transition', async () => {
    const work = createWork(WorkStatus.DRAFT);
    works.findOne.mockResolvedValue(work);
    works.save.mockImplementation(async (value) => value as WorkEntity);

    await expect(
      service.updateStatus(tenantId, workId, WorkStatus.IN_PROGRESS)
    ).resolves.toMatchObject({ status: WorkStatus.IN_PROGRESS });
    expect(works.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: WorkStatus.IN_PROGRESS })
    );
  });

  it('rejects finishing when required snapshot items are missing', async () => {
    const work = createWork(WorkStatus.IN_PROGRESS);
    work.formSnapshot.sections[0].items = [
      {
        id: '3ed4c1d6-fae1-4a7f-a47d-7f1bcb4579b1',
        type: FormItemType.CONCEPT,
        order: 1,
        required: true,
        concept: {
          id: '842550d6-f9b4-475d-899d-1dcaa402c80f',
          code: 'TEMP_ACEITE',
          name: 'Temperatura del aceite',
          type: ConceptType.ANALOG,
          unit: '°C',
          options: [],
        },
      },
      {
        id: 'a13da24b-8c09-4800-9898-77312de6f400',
        type: FormItemType.TASK,
        order: 2,
        title: 'Verificar acceso seguro',
        required: true,
      },
    ];
    works.findOne.mockResolvedValue(work);

    await expect(
      service.finish(tenantId, workId, {
        responses: [],
        taskCompletions: [],
        annotations: [],
      })
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        missingLabels: ['Temperatura del aceite', 'Verificar acceso seguro'],
      }),
    });
    expect(works.save).not.toHaveBeenCalled();
  });

  it('stores a trimmed optional comment for any snapshot item', async () => {
    const work = createWork(WorkStatus.IN_PROGRESS);
    const itemId = '3ed4c1d6-fae1-4a7f-a47d-7f1bcb4579b1';
    work.formSnapshot.sections[0].items = [
      {
        id: itemId,
        type: FormItemType.TASK,
        order: 1,
        title: 'Revisar gabinete',
        required: false,
      },
    ];
    works.findOne.mockResolvedValue(work);

    await service.saveResponses(tenantId, workId, {
      responses: [],
      taskCompletions: [],
      annotations: [{ formItemId: itemId, comment: '  Requiere limpieza.  ' }],
    });

    expect(annotationRepository.save).toHaveBeenCalledWith([
      expect.objectContaining({
        tenantId,
        workId,
        formItemId: itemId,
        comment: 'Requiere limpieza.',
      }),
    ]);
  });

  it('uses the execution day as measuredAt when saving a response', async () => {
    const work = createWork(WorkStatus.IN_PROGRESS);
    const itemId = '3ed4c1d6-fae1-4a7f-a47d-7f1bcb4579b1';
    work.formSnapshot.sections[0].items = [
      {
        id: itemId,
        type: FormItemType.CONCEPT,
        order: 1,
        required: false,
        concept: {
          id: 'faef8ce5-365e-43ba-a291-d483895c8dc1',
          code: 'TEMP',
          name: 'Temperatura',
          type: ConceptType.ANALOG,
          options: [],
        },
      },
    ];
    works.findOne.mockResolvedValue(work);

    await service.saveResponses(tenantId, workId, {
      responses: [
        { formItemId: itemId, valueNumber: 85, measuredAtTime: '14:35' },
      ],
      taskCompletions: [],
      annotations: [],
    });

    expect(responseRepository.save).toHaveBeenCalledWith([
      expect.objectContaining({
        tenantId,
        workId,
        formItemId: itemId,
        measuredAt: '2026-09-10',
        measuredAtTime: '14:35',
        valueNumber: 85,
      }),
    ]);
  });

  it('preserves an existing measurement day when a draft is saved again', async () => {
    const work = createWork(WorkStatus.IN_PROGRESS);
    const itemId = '3ed4c1d6-fae1-4a7f-a47d-7f1bcb4579b1';
    work.formSnapshot.sections[0].items = [
      {
        id: itemId,
        type: FormItemType.CONCEPT,
        order: 1,
        required: false,
        concept: {
          id: 'faef8ce5-365e-43ba-a291-d483895c8dc1',
          code: 'TEMP',
          name: 'Temperatura',
          type: ConceptType.ANALOG,
          options: [],
        },
      },
    ];
    works.findOne.mockResolvedValue(work);
    responseRepository.find.mockResolvedValueOnce([
      {
        id: '96a056f5-28cc-4593-9b70-52462db609f8',
        formItemId: itemId,
        measuredAt: '2026-09-01',
        measuredAtTime: '14:35',
      },
    ]);

    await service.saveResponses(tenantId, workId, {
      responses: [{ formItemId: itemId, valueNumber: 85 }],
      taskCompletions: [],
      annotations: [],
    });

    expect(responseRepository.save).toHaveBeenCalledWith([
      expect.objectContaining({
        measuredAt: '2026-09-01',
        measuredAtTime: '14:35',
      }),
    ]);
  });

  it('rejects status changes for an already finished work', async () => {
    works.findOne.mockResolvedValue(createWork(WorkStatus.FINISHED));

    await expect(
      service.updateStatus(tenantId, workId, WorkStatus.IN_PROGRESS)
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(works.save).not.toHaveBeenCalled();
  });

  it('does not overwrite historical responses of a finished work', async () => {
    works.findOne.mockResolvedValue(createWork(WorkStatus.FINISHED));

    await expect(
      service.saveResponses(tenantId, workId, {
        responses: [],
        taskCompletions: [],
        annotations: [],
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(responseRepository.delete).not.toHaveBeenCalled();
  });

  function createWork(status: WorkStatus): WorkEntity {
    return {
      id: workId,
      tenantId,
      siteId: '9e183cf7-acdd-4841-a240-94e865299099',
      assetId: '40e035aa-da1b-45c7-a177-a5d04fc6eeb2',
      workTypeId: 'ff802f74-1cea-45e6-82e9-0dfa0ddb4068',
      formTemplateId: '4d6801b3-3c62-49cc-828a-150e8b3f3d1a',
      formTemplateVersion: 1,
      title: 'Inspección visual',
      executionDate: '2026-09-10',
      responsible: 'Juan Pérez',
      status,
      formSnapshot: {
        workId,
        tenantId,
        formTemplateId: '4d6801b3-3c62-49cc-828a-150e8b3f3d1a',
        formTemplateVersion: 1,
        name: 'Formulario de inspección',
        sections: [
          {
            id: '7899bb61-bbb8-401e-880d-056070064506',
            title: 'General',
            order: 1,
            items: [],
          },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
});
