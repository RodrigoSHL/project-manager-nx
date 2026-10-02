import { format, subDays, subMonths } from 'date-fns';
import type { AnalyticsFilters } from './models';

export type PeriodPreset = '30d' | '3m' | '6m' | '12m' | 'custom';
export type DashboardFilterValues = AnalyticsFilters & { period: PeriodPreset };

const presets: PeriodPreset[] = ['30d', '3m', '6m', '12m', 'custom'];
const validDate = (value: string | null) =>
  Boolean(
    value &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
      new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
  );

export function presetDates(
  period: Exclude<PeriodPreset, 'custom'>,
  today = new Date()
) {
  const from =
    period === '30d'
      ? subDays(today, 29)
      : subMonths(today, period === '3m' ? 3 : period === '6m' ? 6 : 12);
  return { from: format(from, 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') };
}

export function readDashboardFilters(
  params: URLSearchParams,
  today = new Date()
): DashboardFilterValues {
  const rawPeriod = params.get('period');
  const period: PeriodPreset = presets.includes(rawPeriod as PeriodPreset)
    ? (rawPeriod as PeriodPreset)
    : '6m';
  const fallback = presetDates('6m', today);
  const preset = period === 'custom' ? fallback : presetDates(period, today);
  const fromParam = params.get('from');
  const toParam = params.get('to');
  const from = fromParam && validDate(fromParam) ? fromParam : preset.from;
  const to = toParam && validDate(toParam) ? toParam : preset.to;
  return {
    period,
    from,
    to,
    siteId: params.get('siteId') || undefined,
    workTypeId: params.get('workTypeId') || undefined,
    assetTypeId: params.get('assetTypeId') || undefined,
  };
}

export function changeDashboardFilters(
  params: URLSearchParams,
  change: Partial<DashboardFilterValues>,
  today = new Date()
) {
  const next = new URLSearchParams(params);
  if (change.period && change.period !== 'custom') {
    const dates = presetDates(change.period, today);
    next.set('period', change.period);
    next.set('from', dates.from);
    next.set('to', dates.to);
  } else if (change.period === 'custom') {
    next.set('period', 'custom');
  }
  for (const key of [
    'siteId',
    'workTypeId',
    'assetTypeId',
    'from',
    'to',
  ] as const) {
    if (change[key] !== undefined) {
      if (change[key]) next.set(key, change[key]);
      else next.delete(key);
    }
  }
  return next;
}

export function analyticsFilters(
  values: DashboardFilterValues
): AnalyticsFilters {
  return {
    siteId: values.siteId,
    workTypeId: values.workTypeId,
    assetTypeId: values.assetTypeId,
    from: values.from,
    to: values.to,
  };
}
