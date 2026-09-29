import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { DataSource } from 'typeorm';
import { ANALYTICS_WORK_STATUSES } from './analytics-history.service';
import {
  ActivityFiltersDto,
  ActivityGrouping,
  AnalyticsFiltersDto,
  ConceptsFiltersDto,
  FindingsFiltersDto,
  HistoryFiltersDto,
  MeasurementsFiltersDto,
} from './dto/analytics-filters.dto';

type SqlScope = { where: string; params: unknown[] };
type CountRow = { count: number | string };
const itemAsset = "COALESCE(NULLIF(item->>'assetId', '')::uuid, w.asset_id)";
const itemAssetType =
  "COALESCE(NULLIF(item->>'assetTypeIdSnapshot', '')::uuid, asset.asset_type_id)";
const sections =
  "jsonb_array_elements(COALESCE(w.form_snapshot->'sections', '[]'::jsonb))";
const items = "jsonb_array_elements(COALESCE(section->'items', '[]'::jsonb))";

function dateOnly(value: string | Date | null): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value.slice(0, 10);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(value.getDate()).padStart(2, '0')}`;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly db: DataSource) {}

  private scope(
    tenantId: string,
    filters: AnalyticsFiltersDto,
    dateColumn = 'w.execution_date'
  ): SqlScope {
    for (const date of [filters.from, filters.to]) {
      if (
        date &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
          Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ||
          new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date)
      ) {
        throw new BadRequestException('Dates must use a real YYYY-MM-DD date');
      }
    }
    if (filters.from && filters.to && filters.from > filters.to)
      throw new BadRequestException('from must be on or before to');
    const params: unknown[] = [tenantId, ANALYTICS_WORK_STATUSES];
    const clauses = [
      'w.tenant_id = $1::uuid',
      'w.status = ANY($2::work_status_enum[])',
    ];
    for (const [column, value] of [
      ['w.site_id', filters.siteId],
      ['w.work_type_id', filters.workTypeId],
    ] as const) {
      if (value) {
        params.push(value);
        clauses.push(`${column} = $${params.length}::uuid`);
      }
    }
    if (filters.from) {
      params.push(filters.from);
      clauses.push(`${dateColumn} >= $${params.length}::date`);
    }
    if (filters.to) {
      params.push(filters.to);
      clauses.push(`${dateColumn} <= $${params.length}::date`);
    }
    return { where: clauses.join(' AND '), params };
  }

  private workTypeClause(scope: SqlScope, assetTypeId?: string): SqlScope {
    if (!assetTypeId) return scope;
    scope.params.push(assetTypeId);
    const parameter = `$${scope.params.length}::uuid`;
    scope.where += ` AND (EXISTS (
      SELECT 1 FROM ${sections} section CROSS JOIN LATERAL ${items} item
      LEFT JOIN assets asset ON asset.id = ${itemAsset} AND asset.tenant_id = w.tenant_id
      WHERE ${itemAssetType} = ${parameter}
    ) OR (NOT EXISTS (SELECT 1 FROM ${sections} section CROSS JOIN LATERAL ${items} item)
      AND EXISTS (SELECT 1 FROM assets root WHERE root.id = w.asset_id AND root.tenant_id = w.tenant_id AND root.asset_type_id = ${parameter})))`;
    return scope;
  }

  async summary(tenantId: string, filters: AnalyticsFiltersDto) {
    const work = this.workTypeClause(
      this.scope(tenantId, filters),
      filters.assetTypeId
    );
    const asset = this.scope(tenantId, filters);
    const finding = this.scope(tenantId, filters);
    const measure = this.scope(tenantId, filters, 'r.measured_at');
    if (filters.assetTypeId) {
      asset.params.push(filters.assetTypeId);
      finding.params.push(filters.assetTypeId);
      measure.params.push(filters.assetTypeId);
      asset.where += ` AND ${itemAssetType} = $${asset.params.length}::uuid`;
      finding.where += ` AND asset.asset_type_id = $${finding.params.length}::uuid`;
      measure.where += ` AND ${itemAssetType} = $${measure.params.length}::uuid`;
    }
    const [works, assets, severities, ranges] = await Promise.all([
      this.db.query(
        `SELECT count(*)::integer AS count FROM works w WHERE ${work.where}`,
        work.params
      ),
      this.db.query(
        `SELECT count(DISTINCT inspected.asset_id)::integer AS count FROM (
        SELECT ${itemAsset} AS asset_id FROM works w
        CROSS JOIN LATERAL ${sections} section CROSS JOIN LATERAL ${items} item
        LEFT JOIN assets asset ON asset.id = ${itemAsset} AND asset.tenant_id = w.tenant_id
        WHERE ${asset.where}
        UNION ALL
        SELECT w.asset_id FROM works w
        JOIN assets asset ON asset.id = w.asset_id AND asset.tenant_id = w.tenant_id
        WHERE ${asset.where.split(itemAssetType).join('asset.asset_type_id')}
          AND NOT EXISTS (SELECT 1 FROM ${sections} section CROSS JOIN LATERAL ${items} item)
      ) inspected`,
        asset.params
      ),
      this.db.query(
        `SELECT f.severity_id AS "severityId", COALESCE(s.code, 'NONE') AS code,
        COALESCE(s.name, 'Sin severidad') AS name, count(*)::integer AS count
        FROM findings f JOIN works w ON w.id = f.work_id AND w.tenant_id = f.tenant_id
        LEFT JOIN severity_levels s ON s.id = f.severity_id AND s.tenant_id = f.tenant_id
        LEFT JOIN assets asset ON asset.id = f.asset_id AND asset.tenant_id = f.tenant_id
        WHERE ${finding.where} GROUP BY f.severity_id, s.code, s.name
        ORDER BY count(*) DESC, s.name`,
        finding.params
      ),
      this.db.query(
        `WITH measured AS (
        SELECT r.value_number AS value,
          NULLIF(item->'concept'->>'minValue','')::double precision AS min_value,
          NULLIF(item->'concept'->>'maxValue','')::double precision AS max_value
        FROM concept_responses r JOIN works w ON w.id = r.work_id AND w.tenant_id = r.tenant_id
        CROSS JOIN LATERAL ${sections} section CROSS JOIN LATERAL ${items} item
        LEFT JOIN assets asset ON asset.id = ${itemAsset} AND asset.tenant_id = w.tenant_id
        WHERE ${measure.where} AND r.value_number IS NOT NULL
          AND item->>'id' = r.form_item_id::text AND item->'concept'->>'id' = r.concept_id::text
          AND item->'concept'->>'type' = 'ANALOG'
      ) SELECT count(*) FILTER (WHERE (min_value IS NOT NULL OR max_value IS NOT NULL)
          AND (min_value IS NULL OR value >= min_value) AND (max_value IS NULL OR value <= max_value))::integer AS "inRange",
        count(*) FILTER (WHERE (min_value IS NOT NULL AND value < min_value)
          OR (max_value IS NOT NULL AND value > max_value))::integer AS "outOfRange" FROM measured`,
        measure.params
      ),
    ]);
    const inRange = Number(ranges[0]?.inRange ?? 0);
    const outOfRange = Number(ranges[0]?.outOfRange ?? 0);
    const evaluable = inRange + outOfRange;
    return {
      totalWorks: Number(works[0]?.count ?? 0),
      totalInspectedAssets: Number(assets[0]?.count ?? 0),
      totalFindings: severities.reduce(
        (sum: number, row: CountRow) => sum + Number(row.count),
        0
      ),
      measurementsEvaluable: evaluable,
      measurementsInRange: inRange,
      measurementsOutOfRange: outOfRange,
      percentageInRange: evaluable ? (inRange * 100) / evaluable : undefined,
      findingsBySeverity: severities.map((row: CountRow) => ({
        ...row,
        count: Number(row.count),
      })),
    };
  }

  private findingsBase(
    tenantId: string,
    filters: FindingsFiltersDto | HistoryFiltersDto,
    assetId?: string
  ) {
    const scope = this.scope(tenantId, filters);
    if (assetId) {
      scope.params.push(assetId);
      scope.where += ` AND f.asset_id = $${scope.params.length}::uuid`;
    }
    if ('assetId' in filters && filters.assetId) {
      scope.params.push(filters.assetId);
      scope.where += ` AND f.asset_id = $${scope.params.length}::uuid`;
    }
    if ('severityId' in filters && filters.severityId) {
      scope.params.push(filters.severityId);
      scope.where += ` AND f.severity_id = $${scope.params.length}::uuid`;
    }
    if (filters.assetTypeId) {
      scope.params.push(filters.assetTypeId);
      scope.where += ` AND a.asset_type_id = $${scope.params.length}::uuid`;
    }
    return {
      scope,
      sql: `FROM findings f JOIN works w ON w.id = f.work_id AND w.tenant_id = f.tenant_id
      LEFT JOIN assets a ON a.id = f.asset_id AND a.tenant_id = f.tenant_id
      LEFT JOIN asset_types at ON at.id = a.asset_type_id AND at.tenant_id = f.tenant_id
      LEFT JOIN severity_levels s ON s.id = f.severity_id AND s.tenant_id = f.tenant_id
      WHERE ${scope.where}`,
    };
  }

  async findings(tenantId: string, filters: FindingsFiltersDto) {
    const { scope, sql } = this.findingsBase(tenantId, filters);
    const pagination = [
      ...scope.params,
      filters.pageSize,
      (filters.page - 1) * filters.pageSize,
    ];
    const [total, bySeverity, byAsset, byAssetType, items] = await Promise.all([
      this.db.query(`SELECT count(*)::integer AS count ${sql}`, scope.params),
      this.db.query(
        `SELECT f.severity_id AS "severityId", COALESCE(s.code,'NONE') AS code, COALESCE(s.name,'Sin severidad') AS name, count(*)::integer AS count ${sql} GROUP BY f.severity_id,s.code,s.name ORDER BY count(*) DESC,s.name`,
        scope.params
      ),
      this.db.query(
        `SELECT f.asset_id AS "assetId", COALESCE(a.name,max(f.asset_name_snapshot)) AS "assetName", count(*)::integer AS count ${sql} GROUP BY f.asset_id,a.name ORDER BY count(*) DESC,"assetName",f.asset_id LIMIT $${
          scope.params.length + 1
        }::integer`,
        [...scope.params, filters.limit]
      ),
      this.db.query(
        `SELECT a.asset_type_id AS "assetTypeId", COALESCE(at.name,'Sin tipo') AS "assetTypeName", count(*)::integer AS count ${sql} GROUP BY a.asset_type_id,at.name ORDER BY count(*) DESC,"assetTypeName"`,
        scope.params
      ),
      this.db.query(
        `SELECT f.id, f.work_id AS "workId", f.asset_id AS "assetId", f.title, f.source,
        f.severity_id AS "severityId", COALESCE(s.name,'Sin severidad') AS "severityName",
        COALESCE(a.name,f.asset_name_snapshot) AS "assetName", w.execution_date AS "workDate"
        ${sql} ORDER BY w.execution_date DESC,f.id DESC LIMIT $${
          scope.params.length + 1
        }::integer OFFSET $${scope.params.length + 2}::integer`,
        pagination
      ),
    ]);
    return {
      total: Number(total[0]?.count ?? 0),
      bySeverity: bySeverity.map((r: CountRow) => ({
        ...r,
        count: Number(r.count),
      })),
      byAsset: byAsset.map((r: CountRow) => ({ ...r, count: Number(r.count) })),
      byAssetType: byAssetType.map((r: CountRow) => ({
        ...r,
        count: Number(r.count),
      })),
      page: filters.page,
      pageSize: filters.pageSize,
      items: items.map((r: { workDate: string | Date }) => ({
        ...r,
        workDate: dateOnly(r.workDate),
      })),
    };
  }

  private measurementBase(
    tenantId: string,
    filters: MeasurementsFiltersDto | ConceptsFiltersDto,
    conceptId?: string,
    assetId?: string
  ) {
    const scope = this.scope(tenantId, filters, 'r.measured_at');
    if (conceptId) {
      scope.params.push(conceptId);
      scope.where += ` AND r.concept_id = $${scope.params.length}::uuid`;
    }
    if (assetId) {
      scope.params.push(assetId);
      scope.where += ` AND ${itemAsset} = $${scope.params.length}::uuid`;
    }
    if ('assetId' in filters && filters.assetId) {
      scope.params.push(filters.assetId);
      scope.where += ` AND ${itemAsset} = $${scope.params.length}::uuid`;
    }
    if ('assetIds' in filters && filters.assetIds) {
      const ids = filters.assetIds.split(',').map((id) => id.trim());
      if (ids.length > 50 || ids.some((id) => !isUUID(id)))
        throw new BadRequestException(
          'assetIds must contain 1–50 comma-separated UUIDs'
        );
      scope.params.push(ids);
      scope.where += ` AND ${itemAsset} = ANY($${scope.params.length}::uuid[])`;
    }
    if (filters.assetTypeId) {
      scope.params.push(filters.assetTypeId);
      scope.where += ` AND ${itemAssetType} = $${scope.params.length}::uuid`;
    }
    const sql = `WITH measured AS (
      SELECT r.id AS "responseId", r.concept_id AS "conceptId", w.id AS "workId",
        w.title AS "workTitle",
        EXISTS (SELECT 1 FROM generated_reports gr WHERE gr.tenant_id = w.tenant_id AND gr.work_id = w.id) AS "hasReport",
        w.execution_date AS "workDate", r.measured_at AS "measuredAt", r.form_item_id AS "workItemId",
        ${itemAsset} AS "assetId", COALESCE(item->>'assetNameSnapshot',asset.name) AS "assetName",
        item->'concept'->>'name' AS "conceptName", item->'concept'->>'unit' AS unit,
        r.value_number AS value,
        NULLIF(item->'concept'->>'minValue','')::double precision AS "minValue",
        NULLIF(item->'concept'->>'maxValue','')::double precision AS "maxValue"
      FROM concept_responses r JOIN works w ON w.id = r.work_id AND w.tenant_id = r.tenant_id
      CROSS JOIN LATERAL ${sections} section CROSS JOIN LATERAL ${items} item
      LEFT JOIN assets asset ON asset.id = ${itemAsset} AND asset.tenant_id = w.tenant_id
      WHERE ${scope.where} AND r.value_number IS NOT NULL
        AND item->>'id' = r.form_item_id::text AND item->'concept'->>'id' = r.concept_id::text
        AND item->'concept'->>'type' = 'ANALOG'
    )`;
    return { scope, sql };
  }

  async measurements(tenantId: string, filters: MeasurementsFiltersDto) {
    const conceptRows = await this.db.query(
      `SELECT id,name,type,unit FROM concepts WHERE id = $1::uuid AND tenant_id = $2::uuid AND type = 'ANALOG'`,
      [filters.conceptId, tenantId]
    );
    if (!conceptRows.length)
      throw new NotFoundException('Analog concept not found');
    const { scope, sql } = this.measurementBase(
      tenantId,
      filters,
      filters.conceptId
    );
    const [stats, points] = await Promise.all([
      this.db.query(
        `${sql}, evaluated AS (
        SELECT *, CASE WHEN "minValue" IS NULL AND "maxValue" IS NULL THEN NULL
          ELSE ("minValue" IS NULL OR value >= "minValue") AND ("maxValue" IS NULL OR value <= "maxValue") END AS "isInRange"
        FROM measured)
        SELECT "assetId", max("assetName") AS "assetName", count(*)::integer AS count,
          min(value) AS min, max(value) AS max, avg(value) AS avg,
          (array_agg(value ORDER BY "measuredAt" DESC,"workDate" DESC,"workId" DESC,"workItemId" DESC))[1] AS latest,
          (array_agg("measuredAt" ORDER BY "measuredAt" DESC,"workDate" DESC,"workId" DESC,"workItemId" DESC))[1] AS "latestMeasuredAt",
          (array_agg("minValue" ORDER BY "measuredAt" DESC,"workDate" DESC,"workId" DESC,"workItemId" DESC))[1] AS "latestMinValue",
          (array_agg("maxValue" ORDER BY "measuredAt" DESC,"workDate" DESC,"workId" DESC,"workItemId" DESC))[1] AS "latestMaxValue",
          (array_agg("isInRange" ORDER BY "measuredAt" DESC,"workDate" DESC,"workId" DESC,"workItemId" DESC))[1] AS "latestIsInRange",
          count(*) FILTER (WHERE "isInRange" = true)::integer AS "inRange",
          count(*) FILTER (WHERE "isInRange" IS NOT NULL)::integer AS evaluable
        FROM evaluated GROUP BY "assetId" ORDER BY "assetName","assetId"`,
        scope.params
      ),
      this.db.query(
        `${sql} SELECT m.*, finding.id AS "findingId", finding.title AS "findingTitle" FROM measured m
        LEFT JOIN LATERAL (SELECT f.id,f.title FROM findings f WHERE f.tenant_id = $1::uuid AND f.work_id = m."workId"
          AND f.work_item_id = m."workItemId" AND f.asset_id = m."assetId"
          AND f.concept_id = m."conceptId" AND f.source = 'ANALOG' ORDER BY f.id LIMIT 1) finding ON true
        ORDER BY m."measuredAt",m."workDate",m."workId",m."workItemId"
        LIMIT $${scope.params.length + 1}::integer OFFSET $${
          scope.params.length + 2
        }::integer`,
        [...scope.params, filters.limit, (filters.page - 1) * filters.limit]
      ),
    ]);
    const series = new Map<
      string,
      {
        assetId: string;
        assetName: string;
        measurements: unknown[];
        statistics: Record<string, number | string | boolean | undefined>;
      }
    >();
    for (const row of stats) {
      const evaluable = Number(row.evaluable);
      series.set(row.assetId, {
        assetId: row.assetId,
        assetName: row.assetName,
        measurements: [],
        statistics: {
          count: Number(row.count),
          min: Number(row.min),
          max: Number(row.max),
          avg: Number(row.avg),
          latest: Number(row.latest),
          latestMeasuredAt: dateOnly(row.latestMeasuredAt),
          latestMinValue:
            row.latestMinValue == null ? undefined : Number(row.latestMinValue),
          latestMaxValue:
            row.latestMaxValue == null ? undefined : Number(row.latestMaxValue),
          latestIsInRange: row.latestIsInRange ?? undefined,
          inRange: Number(row.inRange),
          evaluable,
          percentageInRange: evaluable
            ? (Number(row.inRange) * 100) / evaluable
            : undefined,
        },
      });
    }
    for (const row of points) {
      const {
        assetId,
        responseId,
        workItemId,
        workId,
        workTitle,
        hasReport,
        workDate,
        measuredAt,
        value,
        minValue,
        maxValue,
        findingId,
        findingTitle,
      } = row;
      series.get(assetId)?.measurements.push({
        responseId,
        workItemId,
        workId,
        workTitle,
        hasReport,
        workDate: dateOnly(workDate),
        measuredAt: dateOnly(measuredAt),
        value,
        minValue: minValue ?? undefined,
        maxValue: maxValue ?? undefined,
        isInRange:
          minValue == null && maxValue == null
            ? undefined
            : (minValue == null || value >= minValue) &&
              (maxValue == null || value <= maxValue),
        findingId: findingId ?? undefined,
        findingTitle: findingTitle ?? undefined,
      });
    }
    return {
      concept: conceptRows[0],
      totalMeasurements: stats.reduce(
        (n: number, r: CountRow) => n + Number(r.count),
        0
      ),
      page: filters.page,
      pageSize: filters.limit,
      series: [...series.values()],
    };
  }

  async assetHistory(
    tenantId: string,
    assetId: string,
    filters: HistoryFiltersDto
  ) {
    const [asset] = await this.db.query(
      `SELECT a.id,a.name,a.code,a.site_id AS "siteId",at.name AS "assetType"
      FROM assets a JOIN asset_types at ON at.id = a.asset_type_id AND at.tenant_id = a.tenant_id
      WHERE a.id = $1::uuid AND a.tenant_id = $2::uuid`,
      [assetId, tenantId]
    );
    if (!asset) throw new NotFoundException('Asset not found');
    const scope = this.scope(tenantId, filters);
    scope.params.push(assetId);
    scope.where += ` AND (w.asset_id = $${scope.params.length}::uuid OR EXISTS (
      SELECT 1 FROM ${sections} section CROSS JOIN LATERAL ${items} item
      WHERE ${itemAsset} = $${scope.params.length}::uuid))`;
    if (filters.assetTypeId) {
      const [match] = await this.db.query(
        'SELECT 1 FROM assets WHERE id = $1::uuid AND tenant_id = $2::uuid AND asset_type_id = $3::uuid',
        [assetId, tenantId, filters.assetTypeId]
      );
      if (!match)
        return {
          asset,
          summary: { works: 0, findings: 0 },
          works: [],
          findings: [],
          analogConcepts: [],
          page: filters.page,
          pageSize: filters.pageSize,
        };
    }
    const offset = (filters.page - 1) * filters.pageSize;
    const [path, workSummary, works, findingSummary, findings, analogConcepts] =
      await Promise.all([
        this.db.query(
          `WITH RECURSIVE ancestors AS (
        SELECT id,parent_id,name,0 AS depth FROM assets WHERE id = $1::uuid AND tenant_id = $2::uuid
        UNION ALL SELECT parent.id,parent.parent_id,parent.name,child.depth + 1 FROM assets parent
          JOIN ancestors child ON child.parent_id = parent.id WHERE parent.tenant_id = $2::uuid AND child.depth < 30
      ) SELECT string_agg(name,' / ' ORDER BY depth DESC) AS path FROM ancestors`,
          [assetId, tenantId]
        ),
        this.db.query(
          `SELECT count(*)::integer AS count,max(w.execution_date) AS latest FROM works w WHERE ${scope.where}`,
          scope.params
        ),
        this.db.query(
          `SELECT w.id,w.title,w.execution_date AS "executionDate",w.status,w.work_type_id AS "workTypeId",w.asset_id AS "workAssetId"
        FROM works w WHERE ${
          scope.where
        } ORDER BY w.execution_date DESC,w.id DESC
        LIMIT $${scope.params.length + 1}::integer OFFSET $${
            scope.params.length + 2
          }::integer`,
          [...scope.params, filters.pageSize, offset]
        ),
        this.db.query(
          `SELECT count(*)::integer AS count FROM findings f JOIN works w ON w.id = f.work_id AND w.tenant_id = f.tenant_id
        WHERE ${scope.where} AND f.asset_id = $${scope.params.length}::uuid`,
          scope.params
        ),
        this.db.query(
          `SELECT f.id,f.title,f.severity_id AS "severityId",s.name AS "severityName",w.id AS "workId",w.execution_date AS "workDate"
        FROM findings f JOIN works w ON w.id = f.work_id AND w.tenant_id = f.tenant_id
        LEFT JOIN severity_levels s ON s.id = f.severity_id AND s.tenant_id = f.tenant_id
        WHERE ${scope.where} AND f.asset_id = $${scope.params.length}::uuid
        ORDER BY w.execution_date DESC,f.id DESC LIMIT $${
          scope.params.length + 1
        }::integer OFFSET $${scope.params.length + 2}::integer`,
          [...scope.params, filters.pageSize, offset]
        ),
        this.db.query(
          `SELECT r.concept_id AS "conceptId", max(item->'concept'->>'name') AS name,
        max(item->'concept'->>'unit') AS unit,count(*)::integer AS measurements
        FROM concept_responses r JOIN works w ON w.id = r.work_id AND w.tenant_id = r.tenant_id
        CROSS JOIN LATERAL ${sections} section CROSS JOIN LATERAL ${items} item
        WHERE ${scope.where} AND r.value_number IS NOT NULL
          AND ${itemAsset} = $${scope.params.length}::uuid
          AND item->>'id' = r.form_item_id::text AND item->'concept'->>'id' = r.concept_id::text
          AND item->'concept'->>'type' = 'ANALOG'
        GROUP BY r.concept_id ORDER BY name`,
          scope.params
        ),
      ]);
    return {
      asset: { ...asset, path: path[0]?.path },
      summary: {
        works: Number(workSummary[0]?.count ?? 0),
        findings: Number(findingSummary[0]?.count ?? 0),
        lastInspectionAt: dateOnly(workSummary[0]?.latest),
      },
      page: filters.page,
      pageSize: filters.pageSize,
      works: works.map((r: { executionDate: string | Date }) => ({
        ...r,
        executionDate: dateOnly(r.executionDate),
      })),
      findings: findings.map((r: { workDate: string | Date }) => ({
        ...r,
        workDate: dateOnly(r.workDate),
      })),
      analogConcepts,
    };
  }

  async activity(tenantId: string, filters: ActivityFiltersDto) {
    const scope = this.workTypeClause(
      this.scope(tenantId, filters),
      filters.assetTypeId
    );
    const format = {
      [ActivityGrouping.DAY]: 'YYYY-MM-DD',
      [ActivityGrouping.WEEK]: 'IYYY-"W"IW',
      [ActivityGrouping.MONTH]: 'YYYY-MM',
    }[filters.groupBy];
    if (!format)
      throw new BadRequestException('groupBy must be day, week or month');
    const rows = await this.db.query(
      `SELECT to_char(w.execution_date, '${format}') AS period,count(*)::integer AS works
      FROM works w WHERE ${scope.where} GROUP BY period ORDER BY period`,
      scope.params
    );
    return rows.map((r: { period: string; works: number | string }) => ({
      period: r.period,
      works: Number(r.works),
    }));
  }

  async concepts(tenantId: string, filters: ConceptsFiltersDto) {
    const { scope, sql } = this.measurementBase(tenantId, filters);
    const rows = await this.db.query(
      `${sql} SELECT m."conceptId" AS id,
      max(m."conceptName") AS name,max(m.unit) AS unit,count(*)::integer AS "measurementCount"
      FROM measured m GROUP BY m."conceptId" ORDER BY name,id`,
      scope.params
    );
    return rows.map((r: { measurementCount: number | string }) => ({
      ...r,
      measurementCount: Number(r.measurementCount),
    }));
  }
}
