import { BadRequestException } from '@nestjs/common';
import type { DataSource, EntityManager, Repository } from 'typeorm';
import type { CatalogService } from '../catalog/catalog.service';
import { ConceptType } from '../catalog/entities/concept.entity';
import { FormItemType } from '../form-templates/entities/form-item.entity';
import type { FormTemplateEntity } from '../form-templates/entities/form-template.entity';
import type { ConceptResponseEntity } from './entities/concept-response.entity';
import type { TaskCompletionEntity } from './entities/task-completion.entity';
import { WorkEntity, WorkStatus } from './entities/work.entity';
import { WorksService } from './works.service';

describe('WorksService', () => {
  const tenantId = 'f1ee65d1-95bc-5ae4-95d5-f8fb3818f737';
  const workId = '53f9b928-7db8-45c8-a349-c98aa25c078d';
  let works: jest.Mocked<
    Pick<Repository<WorkEntity>, 'findOne' | 'save' | 'create' | 'update'>
  >;
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
    const responseRepository = {
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
    const manager = {
      getRepository: jest.fn((entity) =>
        entity.name === 'ConceptResponseEntity'
          ? responseRepository
          : taskRepository
      ),
    } as unknown as EntityManager;
    const dataSource = {
      transaction: jest.fn(async (action) => action(manager)),
    } as unknown as DataSource;
    service = new WorksService(
      {
        getAsset: jest.fn(),
        listEffectiveWorkTypes: jest.fn(),
        listSites: jest.fn(),
      } as unknown as CatalogService,
      works as unknown as Repository<WorkEntity>,
      responseRepository as unknown as Repository<ConceptResponseEntity>,
      taskRepository as unknown as Repository<TaskCompletionEntity>,
      {} as Repository<FormTemplateEntity>,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      dataSource
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
      })
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        missingLabels: ['Temperatura del aceite', 'Verificar acceso seguro'],
      }),
    });
    expect(works.save).not.toHaveBeenCalled();
  });

  it('rejects status changes for an already finished work', async () => {
    works.findOne.mockResolvedValue(createWork(WorkStatus.FINISHED));

    await expect(
      service.updateStatus(tenantId, workId, WorkStatus.IN_PROGRESS)
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(works.save).not.toHaveBeenCalled();
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
