import { Injectable } from '@nestjs/common';
import { FilesApiService } from '../files-api/files-api.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { InspectionApiClient } from './inspection-api.client';

export type ReportBranding = {
  tenantId: string;
  companyName: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  footerText?: string | null;
};

export type ReportItem = {
  id: string;
  type: 'TASK' | 'CONCEPT';
  title: string;
  description?: string | null;
  assetPath: string;
  completed?: boolean | null;
  value?: string | null;
  observation?: string | null;
  photos: Array<{ id: string; caption: string }>;
};

export type WorkReport = {
  header: {
    tenantId: string;
    workId: string;
    title: string;
    executionDate: string;
    site: string;
    asset: string;
    workType: string;
    responsible: string;
    company: string | null;
    status: string;
    content: string | null;
    requestedBy: string | null;
    preparedBy: string | null;
    approvedBy: string | null;
    distribution: string | null;
    receivedBy: string | null;
    introduction: string | null;
  };
  branding: ReportBranding;
  sections: Array<{
    id: string;
    title: string;
    description?: string | null;
    assetPath: string;
    items: ReportItem[];
  }>;
  observations: string | null;
  findings: Array<{
    number: number;
    id: string;
    assetPath: string;
    title: string;
    description: string | null;
    severity: string | null;
    manHours: number | null;
    materials: string | null;
  }>;
};

type Asset = {
  id: string;
  parentId: string | null;
  name: string;
  code: string;
};
type SnapshotItem = {
  id: string;
  type: 'TASK' | 'CONCEPT';
  order: number;
  title?: string | null;
  description?: string | null;
  assetId?: string;
  assetNameSnapshot?: string;
  assetOrder?: number;
  concept?: {
    type: string;
    name: string;
    unit?: string | null;
    options: Array<{ id: string; label: string }>;
  };
};
type WorkDetails = {
  work: {
    id: string;
    tenantId: string;
    siteId: string;
    assetId: string;
    workTypeId: string;
    title: string;
    executionDate: string;
    responsible: string;
    company?: string | null;
    status: string;
    notes?: string | null;
  };
  snapshot: {
    name: string;
    sections: Array<{
      id: string;
      title: string;
      description?: string | null;
      order: number;
      items: SnapshotItem[];
    }>;
  };
  responses: Array<{
    formItemId: string;
    valueNumber?: number | null;
    valueText?: string | null;
    selectedOptionId?: string | null;
  }>;
  taskCompletions: Array<{ formItemId: string; completed: boolean }>;
  annotations: Array<{ formItemId: string; comment: string }>;
  findings: Array<{
    id: string;
    workItemId: string;
    assetId: string;
    title: string;
    description?: string | null;
    severityId?: string | null;
    manHours?: number | null;
    materials?: string | null;
    sortOrder: number;
  }>;
};
export type ReportOptions = Partial<
  Pick<
    WorkReport['header'],
    | 'content'
    | 'requestedBy'
    | 'preparedBy'
    | 'approvedBy'
    | 'distribution'
    | 'receivedBy'
    | 'introduction'
  >
>;

@Injectable()
export class WorkReportBuilder {
  constructor(
    private readonly inspection: InspectionApiClient,
    private readonly files: FilesApiService
  ) {}

  async buildWorkReport(
    tenantId: string,
    workId: string,
    user: AuthenticatedUser,
    options: ReportOptions = {}
  ): Promise<WorkReport> {
    const detail = (await this.inspection.getWork(
      tenantId,
      workId
    )) as WorkDetails;
    const work = detail.work;
    const [tenants, sites, workTypes, assets, severities, photos] =
      await Promise.all([
        this.inspection.listTenants(),
        this.inspection.listSites(tenantId) as Promise<
          Array<{ id: string; name: string }>
        >,
        this.inspection.listWorkTypes(tenantId) as Promise<
          Array<{ id: string; name: string; description?: string | null }>
        >,
        this.inspection.listAssets(tenantId, work.siteId) as Promise<Asset[]>,
        this.inspection.listSeverityLevels(tenantId) as Promise<
          Array<{ id: string; name: string }>
        >,
        this.files.list(
          {
            application: 'inspection-web',
            ownerType: 'work',
            ownerId: workId,
            tenantId,
          },
          user
        ),
      ]);
    const root = assets.find((asset) => asset.id === work.assetId);
    const assetById = new Map(assets.map((asset) => [asset.id, asset]));
    const assetPath = (assetId?: string, fallback?: string) => {
      const names: string[] = [];
      const seen = new Set<string>();
      let asset = assetById.get(assetId || work.assetId);
      while (asset && !seen.has(asset.id)) {
        seen.add(asset.id);
        names.unshift(asset.name);
        if (asset.id === work.assetId) break;
        asset = assetById.get(asset.parentId || '');
      }
      if (!names.length)
        return (
          [root?.name, fallback].filter(Boolean).join(' › ') ||
          fallback ||
          work.title
        );
      if (names[0] !== root?.name && root) names.unshift(root.name);
      return names.join(' › ');
    };
    const responses = new Map(
      detail.responses.map((row) => [row.formItemId, row])
    );
    const completions = new Map(
      detail.taskCompletions.map((row) => [row.formItemId, row.completed])
    );
    const annotations = new Map(
      detail.annotations.map((row) => [row.formItemId, row.comment])
    );
    const photoByItem = new Map<
      string,
      Array<{ id: string; caption: string }>
    >();
    const allItems = detail.snapshot.sections.flatMap(
      (section) => section.items
    );
    for (const photo of photos) {
      const itemId = String(photo.metadata?.formItemId || '');
      const item = allItems.find((candidate) => candidate.id === itemId);
      if (!item) continue;
      const caption = `${assetPath(item.assetId, item.assetNameSnapshot)} · ${
        item.title || item.concept?.name || 'Evidencia'
      }`;
      photoByItem.set(itemId, [
        ...(photoByItem.get(itemId) || []),
        { id: photo.id, caption },
      ]);
    }
    const groups = new Map<
      string,
      {
        id: string;
        title: string;
        description?: string | null;
        assetPath: string;
        items: ReportItem[];
        order: number;
        assetOrder: number;
      }
    >();
    for (const section of [...detail.snapshot.sections].sort(
      (a, b) => a.order - b.order
    )) {
      for (const item of [...section.items].sort((a, b) => a.order - b.order)) {
        const key = `${item.assetId || work.assetId}:${section.id}`;
        if (!groups.has(key))
          groups.set(key, {
            id: key,
            title: section.title,
            description: section.description,
            assetPath: assetPath(item.assetId, item.assetNameSnapshot),
            items: [],
            order: section.order,
            assetOrder:
              item.assetId === work.assetId || !item.assetId
                ? -1
                : item.assetOrder ?? 9999,
          });
        const response = responses.get(item.id);
        let value: string | null = null;
        if (item.type === 'CONCEPT' && response) {
          if (item.concept?.type === 'ANALOG' && response.valueNumber != null)
            value = `${response.valueNumber}${
              item.concept.unit ? ` ${item.concept.unit}` : ''
            }`;
          else if (item.concept?.type === 'DIGITAL')
            value =
              item.concept.options.find(
                (option) => option.id === response.selectedOptionId
              )?.label ?? null;
          else if (item.concept?.type === 'TEXT')
            value = response.valueText ?? null;
        }
        const group = groups.get(key);
        if (!group) continue;
        group.items.push({
          id: item.id,
          type: item.type,
          title: item.title || item.concept?.name || 'Elemento',
          description: item.description,
          assetPath: assetPath(item.assetId, item.assetNameSnapshot),
          completed:
            item.type === 'TASK'
              ? completions.get(item.id) ?? false
              : undefined,
          value,
          observation: annotations.get(item.id) || null,
          photos: photoByItem.get(item.id) || [],
        });
      }
    }
    const sections = [...groups.values()].sort(
      (a, b) =>
        a.assetOrder - b.assetOrder ||
        a.order - b.order ||
        a.assetPath.localeCompare(b.assetPath)
    );
    const severityById = new Map(
      severities.map((level) => [level.id, level.name])
    );
    const itemById = new Map(allItems.map((item) => [item.id, item]));
    const findings = [...detail.findings]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
      .map((finding, index) => {
        const item = itemById.get(finding.workItemId);
        return {
          number: index + 1,
          id: finding.id,
          assetPath: assetPath(finding.assetId, item?.assetNameSnapshot),
          title: finding.title,
          description: finding.description || null,
          severity: severityById.get(finding.severityId || '') || null,
          manHours: finding.manHours ?? null,
          materials: finding.materials || null,
        };
      });
    const tenant = tenants.find((row) => row.id === tenantId);
    const workType = workTypes.find((row) => row.id === work.workTypeId);
    const optional = (value?: string | null) => value?.trim() || null;
    return {
      header: {
        tenantId,
        workId,
        title: work.title,
        executionDate: work.executionDate,
        site: sites.find((row) => row.id === work.siteId)?.name || '',
        asset: root?.name || '',
        workType: workType?.name || '',
        responsible: work.responsible,
        company: work.company || null,
        status: work.status,
        content: optional(options.content),
        requestedBy: optional(options.requestedBy),
        preparedBy: optional(options.preparedBy),
        approvedBy: optional(options.approvedBy),
        distribution: optional(options.distribution),
        receivedBy: optional(options.receivedBy),
        introduction:
          optional(options.introduction) || optional(workType?.description),
      },
      branding: {
        tenantId,
        companyName: tenant?.name || '',
        logoUrl: null,
        primaryColor: null,
        footerText: null,
      },
      sections: sections.map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        assetPath: section.assetPath,
        items: section.items,
      })),
      observations: work.notes || null,
      findings,
    };
  }
}
