import { BadRequestException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { WorkStatus } from '../works/entities/work.entity';
import {
  AnalyticsHistoryService,
  measurementInRange,
} from './analytics-history.service';

describe('AnalyticsHistoryService', () => {
  const tenantId = 'f1ee65d1-95bc-5ae4-95d5-f8fb3818f737';
  const childAssetId = '53f9b928-7db8-45c8-a349-c98aa25c078d';
  const conceptId = 'a17d47cf-a456-4de2-ae63-a5be73947d0e';
  const query = jest.fn();
  const service = new AnalyticsHistoryService({
    query,
  } as unknown as DataSource);

  beforeEach(() => query.mockReset());

  it('evaluates five historical readings against their frozen 0–80 range', () => {
    const values = [65, 70, 75, 79, 84];
    const evaluated = values.map((value) => measurementInRange(value, 0, 80));
    expect(evaluated.filter((value) => value === true)).toHaveLength(4);
    expect(evaluated.filter((value) => value === false)).toHaveLength(1);
    expect((4 / evaluated.length) * 100).toBe(80);
    expect(measurementInRange(85, undefined, 80)).toBe(false);
    expect(measurementInRange(85, undefined, 90)).toBe(true);
    expect(measurementInRange(85)).toBeUndefined();
  });

  it('reads the child asset, frozen limits, measurement day and confirmed finding', async () => {
    query.mockResolvedValue([
      {
        tenantId,
        siteId: '5859eedb-0762-448f-afd7-6e87833914d6',
        workId: '7c018637-c0e5-4330-b33b-59691bebf9eb',
        workItemId: '70b8cab2-c283-41be-b51e-079baab7f1c0',
        responseId: '3ccbaee5-d086-4816-8173-1d019c87e79a',
        workDate: new Date(2026, 8, 23),
        measuredAt: new Date(2026, 8, 22),
        createdAt: new Date('2026-09-29T12:00:00Z'),
        updatedAt: new Date('2026-09-29T12:00:00Z'),
        assetId: childAssetId,
        assetName: 'Radiador R2',
        assetCode: 'R2',
        assetTypeId: null,
        conceptId,
        conceptName: 'Temperatura',
        value: 85,
        unit: '°C',
        minValue: 0,
        maxValue: 80,
        findingId: '82c7e374-5fc4-4e6f-a607-7136ed2f8522',
      },
    ]);
    const [measurement] = await service.getAssetConceptMeasurements(
      tenantId,
      childAssetId,
      conceptId,
      {
        siteId: '5859eedb-0762-448f-afd7-6e87833914d6',
        from: '2026-01-01',
        to: '2026-12-31',
      }
    );
    expect(measurement).toMatchObject({
      assetId: childAssetId,
      assetName: 'Radiador R2',
      measuredAt: '2026-09-22',
      value: 85,
      maxValue: 80,
      isInRange: false,
      findingId: '82c7e374-5fc4-4e6f-a607-7136ed2f8522',
    });
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain("item->>'assetId'");
    expect(sql).toContain("item->'concept'->>'maxValue'");
    expect(sql).toContain('finding.work_item_id = r.form_item_id');
    expect(sql).toContain('ORDER BY r.measured_at');
    expect(params).toEqual([
      tenantId,
      [WorkStatus.FINISHED, WorkStatus.REVIEWED],
      '5859eedb-0762-448f-afd7-6e87833914d6',
      '2026-01-01',
      '2026-12-31',
      childAssetId,
      conceptId,
    ]);
  });

  it('counts only evaluable analog readings and definitive findings', async () => {
    query
      .mockResolvedValueOnce([{ count: 5 }])
      .mockResolvedValueOnce([{ count: 2 }])
      .mockResolvedValueOnce([
        { severityId: 'critical', severityName: 'Crítica', count: 1 },
      ])
      .mockResolvedValueOnce([{ inRange: 4, outOfRange: 1 }]);
    const metrics = await service.getBaseMetrics(tenantId);
    expect(metrics).toEqual({
      totalWorks: 5,
      totalInspectedAssets: 2,
      totalFindings: 1,
      findingsBySeverity: [
        { severityId: 'critical', severityName: 'Crítica', count: 1 },
      ],
      measurementsInRange: 4,
      measurementsOutOfRange: 1,
      percentageInRange: 80,
    });
    expect(query.mock.calls[2][0]).toContain('FROM findings f');
    expect(query.mock.calls[3][0]).toContain('r.value_number IS NOT NULL');
    expect(query.mock.calls[3][0]).toContain(
      "item->'concept'->>'type' = 'ANALOG'"
    );
  });

  it('rejects reversed dates before querying', async () => {
    await expect(
      service.getConceptMeasurements(tenantId, conceptId, {
        from: '2026-12-31',
        to: '2026-01-01',
      })
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(query).not.toHaveBeenCalled();
  });
});
