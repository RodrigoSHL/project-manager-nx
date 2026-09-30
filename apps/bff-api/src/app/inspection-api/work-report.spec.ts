import { groupReportSections, WorkReportBuilder } from './work-report';
import { InspectionApiClient } from './inspection-api.client';
import { FilesApiService } from '../files-api/files-api.service';

describe('WorkReportBuilder', () => {
  it('regroups legacy saved reports by form section for display and PDF export', () => {
    const item = (id: string, assetPath: string) => ({
      id,
      type: 'CONCEPT' as const,
      title: id,
      assetPath,
      photos: [],
    });
    const grouped = groupReportSections([
      {
        id: 'position-2:before',
        title: 'Registro antes',
        assetPath: 'Presurizado 1 › Posición 2',
        items: [item('before-2', 'Presurizado 1 › Posición 2')],
      },
      {
        id: 'position-2:after',
        title: 'Registro después',
        assetPath: 'Presurizado 1 › Posición 2',
        items: [item('after-2', 'Presurizado 1 › Posición 2')],
      },
      {
        id: 'position-3:before',
        title: 'Registro antes',
        assetPath: 'Presurizado 1 › Posición 3',
        items: [item('before-3', 'Presurizado 1 › Posición 3')],
      },
      {
        id: 'position-3:after',
        title: 'Registro después',
        assetPath: 'Presurizado 1 › Posición 3',
        items: [item('after-3', 'Presurizado 1 › Posición 3')],
      },
    ]);

    expect(grouped.map((section) => section.title)).toEqual([
      'Registro antes',
      'Registro después',
    ]);
    expect(grouped.map((section) => section.assetGroups?.length)).toEqual([
      2, 2,
    ]);
  });

  it('keeps descendant measurements, observations, photos and reviewed findings together', async () => {
    const rootId = 'root';
    const childId = 'child';
    const inspection = {
      getWork: jest.fn().mockResolvedValue({
        work: {
          id: 'work',
          tenantId: 'tenant',
          siteId: 'site',
          assetId: rootId,
          workTypeId: 'type',
          title: 'Inspección T1',
          executionDate: '2026-09-29',
          responsible: 'Rodrigo',
          company: 'Contratista',
          status: 'REVIEWED',
          notes: 'Observación general',
        },
        snapshot: {
          name: 'Plantilla',
          sections: [
            {
              id: 'section',
              title: 'Mediciones',
              order: 1,
              items: [
                {
                  id: 'measure',
                  type: 'CONCEPT',
                  order: 1,
                  assetId: childId,
                  assetOrder: 1,
                  title: 'Temperatura',
                  concept: {
                    type: 'ANALOG',
                    name: 'Temperatura',
                    unit: '°C',
                    options: [],
                  },
                },
                {
                  id: 'digital',
                  type: 'CONCEPT',
                  order: 2,
                  assetId: childId,
                  assetOrder: 1,
                  title: 'Estado',
                  concept: {
                    type: 'DIGITAL',
                    name: 'Estado',
                    options: [{ id: 'option', label: 'Buen Estado' }],
                  },
                },
                {
                  id: 'task',
                  type: 'TASK',
                  order: 3,
                  assetId: childId,
                  assetOrder: 1,
                  title: 'Revisar equipo',
                },
              ],
            },
          ],
        },
        responses: [
          { formItemId: 'measure', valueNumber: 51 },
          { formItemId: 'digital', selectedOptionId: 'option' },
        ],
        taskCompletions: [{ formItemId: 'task', completed: true }],
        annotations: [{ formItemId: 'measure', comment: 'Sensor revisado' }],
        findings: [
          {
            id: 'finding',
            workItemId: 'measure',
            assetId: childId,
            title: 'Texto corregido',
            description: 'Descripción del revisor',
            severityId: 'high',
            manHours: 2,
            materials: 'Cable',
            sortOrder: 3,
          },
        ],
      }),
      listTenants: jest
        .fn()
        .mockResolvedValue([{ id: 'tenant', name: 'Minera' }]),
      listSites: jest
        .fn()
        .mockResolvedValue([{ id: 'site', name: 'Faena Norte' }]),
      listWorkTypes: jest
        .fn()
        .mockResolvedValue([{ id: 'type', name: 'Inspección Visual' }]),
      listAssets: jest.fn().mockResolvedValue([
        { id: rootId, parentId: null, name: 'Transformador T1' },
        { id: childId, parentId: rootId, name: 'Radiador R2' },
      ]),
      listSeverityLevels: jest
        .fn()
        .mockResolvedValue([{ id: 'high', name: 'ALTA' }]),
    };
    const files = {
      list: jest
        .fn()
        .mockResolvedValue([
          { id: 'photo', metadata: { formItemId: 'measure' } },
        ]),
    };
    const builder = new WorkReportBuilder(
      inspection as unknown as InspectionApiClient,
      files as unknown as FilesApiService
    );
    const report = await builder.buildWorkReport('tenant', 'work', {} as never);
    expect(report.sections).toHaveLength(1);
    expect(report.sections[0].assetGroups?.[0].assetPath).toBe(
      'Transformador T1 › Radiador R2'
    );
    expect(report.sections[0].assetGroups?.[0].items[0]).toMatchObject({
      value: '51 °C',
      observation: 'Sensor revisado',
      photos: [{ id: 'photo' }],
    });
    expect(report.sections[0].assetGroups?.[0].items[1].value).toBe(
      'Buen Estado'
    );
    expect(report.sections[0].assetGroups?.[0].items[2].completed).toBe(true);
    expect(report.findings).toEqual([
      {
        number: 1,
        id: 'finding',
        assetPath: 'Transformador T1 › Radiador R2',
        title: 'Texto corregido',
        description: 'Descripción del revisor',
        severity: 'ALTA',
        manHours: 2,
        materials: 'Cable',
      },
    ]);
    expect(report.observations).toBe('Observación general');
  });

  it('groups descendant assets inside each form section in template order', async () => {
    const rootId = 'root';
    const position2Id = 'position-2';
    const position3Id = 'position-3';
    const concept = {
      type: 'ANALOG',
      name: 'Anemómetro',
      unit: 'm/s',
      options: [],
    };
    const item = (id: string, assetId: string, assetOrder: number) => ({
      id,
      type: 'CONCEPT' as const,
      order: 1,
      assetId,
      assetOrder,
      title: id,
      concept,
    });
    const inspection = {
      getWork: jest.fn().mockResolvedValue({
        work: {
          id: 'work',
          tenantId: 'tenant',
          siteId: 'site',
          assetId: rootId,
          workTypeId: 'type',
          title: 'Mantención',
          executionDate: '2026-09-29',
          responsible: 'Rodrigo',
          status: 'REVIEWED',
        },
        snapshot: {
          sections: [
            {
              id: 'before',
              title: 'Registro antes',
              order: 1,
              items: [
                item('before-2', position2Id, 2),
                item('before-3', position3Id, 3),
              ],
            },
            {
              id: 'after',
              title: 'Registro después',
              order: 2,
              items: [
                item('after-2', position2Id, 2),
                item('after-3', position3Id, 3),
              ],
            },
          ],
        },
        responses: [],
        taskCompletions: [],
        annotations: [],
        findings: [],
      }),
      listTenants: jest.fn().mockResolvedValue([]),
      listSites: jest.fn().mockResolvedValue([]),
      listWorkTypes: jest.fn().mockResolvedValue([]),
      listAssets: jest.fn().mockResolvedValue([
        { id: rootId, parentId: null, name: 'Presurizado 1' },
        { id: position2Id, parentId: rootId, name: 'Posición 2' },
        { id: position3Id, parentId: rootId, name: 'Posición 3' },
      ]),
      listSeverityLevels: jest.fn().mockResolvedValue([]),
    };
    const builder = new WorkReportBuilder(
      inspection as unknown as InspectionApiClient,
      { list: jest.fn().mockResolvedValue([]) } as unknown as FilesApiService
    );

    const report = await builder.buildWorkReport('tenant', 'work', {} as never);

    expect(report.sections.map((section) => section.title)).toEqual([
      'Registro antes',
      'Registro después',
    ]);
    expect(
      report.sections.map((section) =>
        section.assetGroups?.map((group) => group.assetPath)
      )
    ).toEqual([
      ['Presurizado 1 › Posición 2', 'Presurizado 1 › Posición 3'],
      ['Presurizado 1 › Posición 2', 'Presurizado 1 › Posición 3'],
    ]);
  });

  it('always includes an empty findings section', async () => {
    const inspection = {
      getWork: jest.fn().mockResolvedValue({
        work: {
          id: 'work',
          tenantId: 'tenant',
          siteId: 'site',
          assetId: 'asset',
          workTypeId: 'type',
          title: 'Trabajo',
          executionDate: '2026-09-29',
          responsible: 'A',
          status: 'FINISHED',
        },
        snapshot: { sections: [] },
        responses: [],
        taskCompletions: [],
        annotations: [],
        findings: [],
      }),
      listTenants: jest
        .fn()
        .mockResolvedValue([{ id: 'tenant', name: 'Minera' }]),
      listSites: jest.fn().mockResolvedValue([]),
      listWorkTypes: jest.fn().mockResolvedValue([]),
      listAssets: jest.fn().mockResolvedValue([]),
      listSeverityLevels: jest.fn().mockResolvedValue([]),
    };
    const builder = new WorkReportBuilder(
      inspection as unknown as InspectionApiClient,
      { list: jest.fn().mockResolvedValue([]) } as unknown as FilesApiService
    );
    expect(
      (await builder.buildWorkReport('tenant', 'work', {} as never)).findings
    ).toEqual([]);
  });
});
