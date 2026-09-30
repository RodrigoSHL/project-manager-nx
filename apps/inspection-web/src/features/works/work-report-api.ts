import { authenticatedFetch } from '../auth/authenticated-fetch';

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
  branding: {
    tenantId: string;
    companyName: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
    footerText?: string | null;
  };
  sections: ReportSection[];
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

export type ReportAssetGroup = {
  id: string;
  assetPath: string;
  items: ReportItem[];
};

export type ReportSection = {
  id: string;
  title: string;
  description?: string | null;
  /** Optional legacy fields keep saved report versions readable. */
  assetPath: string;
  items: ReportItem[];
  assetGroups?: ReportAssetGroup[];
};

export function groupReportSections(sections: ReportSection[]) {
  const grouped = new Map<string, ReportSection>();

  for (const section of sections) {
    const legacySeparator = section.id.lastIndexOf(':');
    const id = section.assetGroups
      ? section.id
      : legacySeparator >= 0
      ? section.id.slice(legacySeparator + 1)
      : section.id;
    const current = grouped.get(id) ?? {
      ...section,
      id,
      assetPath: '',
      items: [],
      assetGroups: [],
    };
    const incomingGroups = section.assetGroups ?? [
      {
        id: section.assetPath || section.id,
        assetPath: section.assetPath,
        items: section.items,
      },
    ];
    for (const incoming of incomingGroups) {
      const assetGroup = current.assetGroups?.find(
        (candidate) => candidate.id === incoming.id
      );
      if (assetGroup) assetGroup.items.push(...incoming.items);
      else
        current.assetGroups?.push({ ...incoming, items: [...incoming.items] });
    }
    current.items = current.assetGroups?.flatMap((group) => group.items) ?? [];
    grouped.set(id, current);
  }

  return [...grouped.values()];
}

export type GeneratedReport = {
  id: string;
  version: number;
  status: 'DRAFT' | 'FINAL';
  reportSnapshot: WorkReport;
  generatedAt: string;
  generatedBy: string | null;
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

const path = (tenantId: string, workId: string) =>
  `/api/inspection/tenants/${encodeURIComponent(
    tenantId
  )}/works/${encodeURIComponent(workId)}/report`;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await authenticatedFetch(url, init);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    throw new Error(
      Array.isArray(body?.message)
        ? body.message.join(', ')
        : body?.message || 'No se pudo cargar el informe.'
    );
  }
  return response.json() as Promise<T>;
}

export const workReportApi = {
  preview: (tenantId: string, workId: string) =>
    request<WorkReport>(path(tenantId, workId)),
  versions: (tenantId: string, workId: string) =>
    request<GeneratedReport[]>(`${path(tenantId, workId)}/versions`),
  create: (
    tenantId: string,
    workId: string,
    status: 'DRAFT' | 'FINAL',
    options: ReportOptions
  ) =>
    request<GeneratedReport>(`${path(tenantId, workId)}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, options }),
    }),
  pdf: async (tenantId: string, workId: string, reportId?: string) => {
    const url = `${path(tenantId, workId)}/pdf${
      reportId ? `?reportId=${encodeURIComponent(reportId)}` : ''
    }`;
    const response = await authenticatedFetch(url);
    if (!response.ok) throw new Error('No se pudo generar el PDF.');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `informe-${workId}.pdf`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
  },
};
