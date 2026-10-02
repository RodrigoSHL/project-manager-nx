import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WorkStatus } from '../works/entities/work.entity';

export interface AnalyticsHistoryFilters {
  siteId?: string;
  from?: string;
  to?: string;
  workTypeId?: string;
}

export interface MeasurementRecord {
  tenantId: string;
  siteId: string;
  workId: string;
  workItemId: string;
  responseId: string;
  workDate: string;
  measuredAt: string;
  createdAt: Date;
  updatedAt: Date;
  assetId: string;
  assetName: string;
  assetCode?: string;
  assetTypeId?: string;
  conceptId: string;
  conceptName: string;
  value: number;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  isInRange?: boolean;
  findingId?: string;
}

export interface AnalyticsBaseMetrics {
  totalWorks: number;
  totalInspectedAssets: number;
  totalFindings: number;
  findingsBySeverity: Array<{
    severityId: string | null;
    severityName: string;
    count: number;
  }>;
  measurementsInRange: number;
  measurementsOutOfRange: number;
  percentageInRange?: number;
}

// DRAFT and IN_PROGRESS can still change. A new inspection creates a new Work.
export const ANALYTICS_WORK_STATUSES: readonly WorkStatus[] = [
  WorkStatus.FINISHED,
  WorkStatus.REVIEWED,
];

type MeasurementRow = Omit<
  MeasurementRecord,
  'isInRange' | 'workDate' | 'measuredAt'
> & {
  workDate: string | Date;
  measuredAt: string | Date;
  minValue: number | null;
  maxValue: number | null;
  unit: string | null;
  assetCode: string | null;
  assetTypeId: string | null;
  findingId: string | null;
};

export function measurementInRange(
  value: number,
  minValue?: number | null,
  maxValue?: number | null
): boolean | undefined {
  if (minValue == null && maxValue == null) return undefined;
  return (
    (minValue == null || value >= minValue) &&
    (maxValue == null || value <= maxValue)
  );
}

function dateOnly(value: string | Date): string {
  if (typeof value === 'string') return value.slice(0, 10);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Injectable()
export class AnalyticsHistoryService {
  constructor(private readonly dataSource: DataSource) {}

  getAssetMeasurements(
    tenantId: string,
    assetId: string,
    filters: AnalyticsHistoryFilters = {}
  ) {
    return this.measurements(tenantId, filters, assetId);
  }

  getConceptMeasurements(
    tenantId: string,
    conceptId: string,
    filters: AnalyticsHistoryFilters = {}
  ) {
    return this.measurements(tenantId, filters, undefined, conceptId);
  }

  getAssetConceptMeasurements(
    tenantId: string,
    assetId: string,
    conceptId: string,
    filters: AnalyticsHistoryFilters = {}
  ) {
    return this.measurements(tenantId, filters, assetId, conceptId);
  }

  async getBaseMetrics(
    tenantId: string,
    filters: AnalyticsHistoryFilters = {}
  ): Promise<AnalyticsBaseMetrics> {
    const workScope = this.scope(tenantId, filters, 'w.execution_date');
    const measurementScope = this.scope(tenantId, filters, 'r.measured_at');
    const [workRows, assetRows, findingRows, measurementRows] =
      await Promise.all([
        this.dataSource.query(
          `SELECT count(*)::integer AS count FROM works w WHERE ${workScope.where}`,
          workScope.params
        ),
        this.dataSource.query(
          `SELECT count(DISTINCT asset_id)::integer AS count FROM (
            SELECT w.asset_id FROM works w WHERE ${workScope.where}
            UNION ALL
            SELECT COALESCE(NULLIF(item->>'assetId', '')::uuid, w.asset_id)
            FROM works w
            CROSS JOIN LATERAL jsonb_array_elements(w.form_snapshot->'sections') section
            CROSS JOIN LATERAL jsonb_array_elements(section->'items') item
            WHERE ${workScope.where}
          ) inspected`,
          workScope.params
        ),
        this.dataSource.query(
          `SELECT f.severity_id AS "severityId",
                  COALESCE(severity.name, 'Sin severidad') AS "severityName",
                  count(*)::integer AS count
           FROM findings f
           JOIN works w ON w.id = f.work_id AND w.tenant_id = f.tenant_id
           LEFT JOIN severity_levels severity
             ON severity.id = f.severity_id AND severity.tenant_id = f.tenant_id
           WHERE ${workScope.where}
           GROUP BY f.severity_id, severity.name
           ORDER BY count(*) DESC, severity.name`,
          workScope.params
        ),
        this.dataSource.query(
          `WITH measurements AS (
            SELECT r.value_number AS value,
                   NULLIF(item->'concept'->>'minValue', '')::double precision AS min_value,
                   NULLIF(item->'concept'->>'maxValue', '')::double precision AS max_value
            FROM concept_responses r
            JOIN works w ON w.id = r.work_id AND w.tenant_id = r.tenant_id
            CROSS JOIN LATERAL jsonb_array_elements(w.form_snapshot->'sections') section
            CROSS JOIN LATERAL jsonb_array_elements(section->'items') item
            WHERE ${measurementScope.where}
              AND r.value_number IS NOT NULL
              AND item->>'id' = r.form_item_id::text
              AND item->'concept'->>'id' = r.concept_id::text
              AND item->'concept'->>'type' = 'ANALOG'
          )
          SELECT count(*) FILTER (WHERE (min_value IS NOT NULL OR max_value IS NOT NULL)
            AND (min_value IS NULL OR value >= min_value)
            AND (max_value IS NULL OR value <= max_value))::integer AS "inRange",
                 count(*) FILTER (WHERE (min_value IS NOT NULL OR max_value IS NOT NULL)
            AND ((min_value IS NOT NULL AND value < min_value)
              OR (max_value IS NOT NULL AND value > max_value)))::integer AS "outOfRange"
          FROM measurements`,
          measurementScope.params
        ),
      ]);

    const findingsBySeverity = (
      findingRows as Array<{
        severityId: string | null;
        severityName: string;
        count: number;
      }>
    ).map((row) => ({ ...row, count: Number(row.count) }));
    const measurementsInRange = Number(measurementRows[0]?.inRange ?? 0);
    const measurementsOutOfRange = Number(measurementRows[0]?.outOfRange ?? 0);
    const evaluable = measurementsInRange + measurementsOutOfRange;
    return {
      totalWorks: Number(workRows[0]?.count ?? 0),
      totalInspectedAssets: Number(assetRows[0]?.count ?? 0),
      totalFindings: findingsBySeverity.reduce(
        (sum, row) => sum + row.count,
        0
      ),
      findingsBySeverity,
      measurementsInRange,
      measurementsOutOfRange,
      percentageInRange:
        evaluable === 0 ? undefined : (measurementsInRange / evaluable) * 100,
    };
  }

  private async measurements(
    tenantId: string,
    filters: AnalyticsHistoryFilters,
    assetId?: string,
    conceptId?: string
  ): Promise<MeasurementRecord[]> {
    const scope = this.scope(tenantId, filters, 'r.measured_at');
    if (assetId) {
      scope.params.push(assetId);
      scope.where += ` AND COALESCE(NULLIF(item->>'assetId', '')::uuid, w.asset_id) = $${scope.params.length}::uuid`;
    }
    if (conceptId) {
      scope.params.push(conceptId);
      scope.where += ` AND r.concept_id = $${scope.params.length}::uuid`;
    }
    const rows: MeasurementRow[] = await this.dataSource.query(
      `SELECT r.tenant_id AS "tenantId", w.site_id AS "siteId",
              w.id AS "workId", r.form_item_id AS "workItemId", r.id AS "responseId",
              w.execution_date AS "workDate", r.measured_at AS "measuredAt",
              r.created_at AS "createdAt", r.updated_at AS "updatedAt",
              COALESCE(NULLIF(item->>'assetId', '')::uuid, w.asset_id) AS "assetId",
              COALESCE(item->>'assetNameSnapshot', asset.name) AS "assetName",
              COALESCE(item->>'assetCodeSnapshot', asset.code) AS "assetCode",
              item->>'assetTypeIdSnapshot' AS "assetTypeId",
              r.concept_id AS "conceptId",
              item->'concept'->>'name' AS "conceptName",
              r.value_number AS value,
              item->'concept'->>'unit' AS unit,
              NULLIF(item->'concept'->>'minValue', '')::double precision AS "minValue",
              NULLIF(item->'concept'->>'maxValue', '')::double precision AS "maxValue",
              finding.id AS "findingId"
       FROM concept_responses r
       JOIN works w ON w.id = r.work_id AND w.tenant_id = r.tenant_id
       CROSS JOIN LATERAL jsonb_array_elements(w.form_snapshot->'sections') section
       CROSS JOIN LATERAL jsonb_array_elements(section->'items') item
       LEFT JOIN assets asset
         ON asset.id = COALESCE(NULLIF(item->>'assetId', '')::uuid, w.asset_id)
        AND asset.tenant_id = w.tenant_id
       LEFT JOIN findings finding
         ON finding.tenant_id = r.tenant_id AND finding.work_id = r.work_id
        AND finding.work_item_id = r.form_item_id
        AND finding.asset_id = COALESCE(NULLIF(item->>'assetId', '')::uuid, w.asset_id)
        AND finding.concept_id = r.concept_id AND finding.source = 'ANALOG'
       WHERE ${scope.where}
         AND r.value_number IS NOT NULL
         AND item->>'id' = r.form_item_id::text
         AND item->'concept'->>'id' = r.concept_id::text
         AND item->'concept'->>'type' = 'ANALOG'
       ORDER BY r.measured_at, w.execution_date, w.id, r.form_item_id`,
      scope.params
    );
    return rows.map((row) => ({
      tenantId: row.tenantId,
      siteId: row.siteId,
      workId: row.workId,
      workItemId: row.workItemId,
      responseId: row.responseId,
      workDate: dateOnly(row.workDate),
      measuredAt: dateOnly(row.measuredAt),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      assetId: row.assetId,
      assetName: row.assetName,
      assetCode: row.assetCode ?? undefined,
      assetTypeId: row.assetTypeId ?? undefined,
      conceptId: row.conceptId,
      conceptName: row.conceptName,
      value: row.value,
      unit: row.unit ?? undefined,
      minValue: row.minValue ?? undefined,
      maxValue: row.maxValue ?? undefined,
      isInRange: measurementInRange(row.value, row.minValue, row.maxValue),
      findingId: row.findingId ?? undefined,
    }));
  }

  private scope(
    tenantId: string,
    filters: AnalyticsHistoryFilters,
    dateExpression: string
  ) {
    for (const date of [filters.from, filters.to]) {
      if (
        date &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
          Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ||
          new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date)
      ) {
        throw new BadRequestException('Analytics dates must use YYYY-MM-DD');
      }
    }
    if (filters.from && filters.to && filters.from > filters.to) {
      throw new BadRequestException('Analytics from must be before to');
    }
    const params: unknown[] = [tenantId, ANALYTICS_WORK_STATUSES];
    const clauses = [
      'w.tenant_id = $1::uuid',
      'w.status = ANY($2::work_status_enum[])',
    ];
    if (filters.siteId) {
      params.push(filters.siteId);
      clauses.push(`w.site_id = $${params.length}::uuid`);
    }
    if (filters.workTypeId) {
      params.push(filters.workTypeId);
      clauses.push(`w.work_type_id = $${params.length}::uuid`);
    }
    if (filters.from) {
      params.push(filters.from);
      clauses.push(`${dateExpression} >= $${params.length}::date`);
    }
    if (filters.to) {
      params.push(filters.to);
      clauses.push(`${dateExpression} <= $${params.length}::date`);
    }
    return { where: clauses.join(' AND '), params };
  }
}
