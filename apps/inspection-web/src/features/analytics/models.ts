export type AnalyticsFilters = {
  siteId?: string;
  workTypeId?: string;
  assetTypeId?: string;
  from: string;
  to: string;
};

export type SeverityCount = {
  severityId: string | null;
  code: string;
  name: string;
  count: number;
};

export type AnalyticsSummary = {
  totalWorks: number;
  totalInspectedAssets: number;
  totalFindings: number;
  measurementsEvaluable: number;
  measurementsInRange: number;
  measurementsOutOfRange: number;
  percentageInRange?: number;
  findingsBySeverity: SeverityCount[];
};

export type FindingsByAsset = {
  assetId: string;
  assetName: string;
  count: number;
};

export type FindingsByAssetType = {
  assetTypeId: string | null;
  assetTypeName: string;
  count: number;
};

export type FindingListItem = {
  id: string;
  workId: string;
  assetId: string;
  assetName: string;
  title: string;
  severityId: string | null;
  severityName: string;
  workDate: string;
};

export type AnalyticsFindings = {
  total: number;
  bySeverity: SeverityCount[];
  byAsset: FindingsByAsset[];
  byAssetType: FindingsByAssetType[];
  items: FindingListItem[];
  page: number;
  pageSize: number;
};

export type ActivityPoint = { period: string; works: number };

export type AnalyticsConcept = {
  id: string;
  name: string;
  unit?: string | null;
  measurementCount: number;
};

export type AssetHistory = {
  asset: {
    id: string;
    name: string;
    code?: string;
    assetType: string;
    path?: string;
  };
  summary: { works: number; findings: number; lastInspectionAt?: string };
  works: Array<{
    id: string;
    title: string;
    executionDate: string;
    status: string;
    workAssetId: string;
  }>;
  findings: Array<{
    id: string;
    title: string;
    severityName: string;
    workId: string;
    workDate: string;
  }>;
  analogConcepts: Array<{
    conceptId: string;
    name: string;
    unit?: string;
    measurements: number;
  }>;
  page: number;
  pageSize: number;
};

export type LoadState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};
