import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  const tenantId = '00000000-0000-4000-8000-000000000001';
  const foreignTenantId = '00000000-0000-4000-8000-000000000002';
  const assetId = '00000000-0000-4000-8000-000000000003';
  const conceptId = '00000000-0000-4000-8000-000000000004';
  const siteId = '00000000-0000-4000-8000-000000000005';
  const query = jest.fn();
  const service = new AnalyticsService({ query } as unknown as DataSource);

  beforeEach(() => query.mockReset());

  it('summarizes only definitive findings and evaluable analog measurements', async () => {
    query
      .mockResolvedValueOnce([{ count: 2 }])
      .mockResolvedValueOnce([{ count: 3 }])
      .mockResolvedValueOnce([
        { severityId: 'critical', code: 'CRITICAL', name: 'Crítica', count: 1 },
      ])
      .mockResolvedValueOnce([{ inRange: 4, outOfRange: 1 }]);
    const summary = await service.summary(tenantId, {
      siteId,
      from: '2026-09-01',
      to: '2026-09-30',
    });
    expect(summary).toMatchObject({
      totalWorks: 2,
      totalInspectedAssets: 3,
      totalFindings: 1,
      measurementsEvaluable: 5,
      percentageInRange: 80,
      findingsBySeverity: [{ code: 'CRITICAL', count: 1 }],
    });
    for (const [, params] of query.mock.calls) {
      expect(params[0]).toBe(tenantId);
      expect(params).toContain(siteId);
      expect(params).toContain('2026-09-30');
    }
    expect(query.mock.calls[1][0]).toContain("item->>'assetId'");
    expect(query.mock.calls[2][0]).toContain('FROM findings f');
    expect(query.mock.calls[3][0]).toContain("item->'concept'->>'maxValue'");
  });

  it('returns two independent child asset series, ordered by measuredAt and using frozen ranges', async () => {
    const secondAsset = '00000000-0000-4000-8000-000000000006';
    query
      .mockResolvedValueOnce([
        { id: conceptId, name: 'Temperatura', type: 'ANALOG', unit: '°C' },
      ])
      .mockResolvedValueOnce([
        {
          assetId,
          assetName: 'Radiador R1',
          count: 2,
          min: 65,
          max: 84,
          avg: 74.5,
          latest: 84,
          inRange: 1,
          evaluable: 2,
        },
        {
          assetId: secondAsset,
          assetName: 'Radiador R2',
          count: 1,
          min: 62,
          max: 62,
          avg: 62,
          latest: 62,
          inRange: 1,
          evaluable: 1,
        },
      ])
      .mockResolvedValueOnce([
        {
          assetId,
          workId: 'work-1',
          workDate: '2026-09-01',
          measuredAt: '2026-09-01',
          value: 65,
          minValue: 0,
          maxValue: 80,
        },
        {
          assetId: secondAsset,
          workId: 'work-2',
          workDate: '2026-09-02',
          measuredAt: '2026-09-02',
          value: 62,
          minValue: 0,
          maxValue: 80,
        },
        {
          assetId,
          workId: 'work-3',
          workDate: '2026-09-03',
          measuredAt: '2026-09-03',
          value: 84,
          minValue: 0,
          maxValue: 80,
          findingId: 'finding-1',
        },
      ]);
    const result = await service.measurements(tenantId, {
      conceptId,
      assetIds: `${assetId},${secondAsset}`,
      limit: 100,
      page: 1,
    });
    expect(result.totalMeasurements).toBe(3);
    expect(result.series).toHaveLength(2);
    expect(result.series[0].measurements).toEqual([
      expect.objectContaining({ measuredAt: '2026-09-01', isInRange: true }),
      expect.objectContaining({
        measuredAt: '2026-09-03',
        isInRange: false,
        findingId: 'finding-1',
      }),
    ]);
    expect(result.series[0].statistics).toMatchObject({
      avg: 74.5,
      latest: 84,
      percentageInRange: 50,
    });
    expect(query.mock.calls[1][0]).toContain('GROUP BY "assetId"');
    expect(query.mock.calls[2][0]).toContain('ORDER BY m."measuredAt"');
    expect(query.mock.calls[2][1]).toContainEqual([assetId, secondAsset]);
  });

  it('finds a child asset inside its parent Work snapshot with bounded pages', async () => {
    query
      .mockResolvedValueOnce([
        { id: assetId, name: 'Radiador R1', code: 'R1', assetType: 'Radiador' },
      ])
      .mockResolvedValueOnce([{ path: 'Transformador T1 / Radiador R1' }])
      .mockResolvedValueOnce([{ count: 1, latest: '2026-09-23' }])
      .mockResolvedValueOnce([
        {
          id: 'parent-work',
          workAssetId: 'parent-asset',
          executionDate: '2026-09-23',
        },
      ])
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce([{ id: 'finding-1', workDate: '2026-09-23' }])
      .mockResolvedValueOnce([
        { conceptId, name: 'Temperatura', unit: '°C', measurements: 1 },
      ]);
    const result = await service.assetHistory(tenantId, assetId, {
      page: 1,
      pageSize: 25,
    });
    expect(result.summary).toMatchObject({
      works: 1,
      findings: 1,
      lastInspectionAt: '2026-09-23',
    });
    expect(result.works[0].workAssetId).toBe('parent-asset');
    expect(result.analogConcepts[0].conceptId).toBe(conceptId);
    expect(query.mock.calls[2][0]).toContain("item->>'assetId'");
    expect(query.mock.calls[3][0]).toContain(
      'LIMIT $4::integer OFFSET $5::integer'
    );
    expect(query.mock.calls[3][1]).toEqual([
      tenantId,
      ['FINISHED', 'REVIEWED'],
      assetId,
      25,
      0,
    ]);
  });

  it('does not reveal an asset belonging to a different tenant', async () => {
    query.mockResolvedValueOnce([]);
    await expect(
      service.assetHistory(foreignTenantId, assetId, { page: 1, pageSize: 25 })
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][1]).toEqual([assetId, foreignTenantId]);
  });

  it('rejects reversed dates and malformed asset comparisons', async () => {
    await expect(
      service.summary(tenantId, { from: '2026-10-01', to: '2026-09-30' })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(query).not.toHaveBeenCalled();
    query.mockResolvedValueOnce([
      { id: conceptId, name: 'Temperatura', type: 'ANALOG' },
    ]);
    await expect(
      service.measurements(tenantId, {
        conceptId,
        assetIds: 'bad-id',
        limit: 100,
        page: 1,
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
