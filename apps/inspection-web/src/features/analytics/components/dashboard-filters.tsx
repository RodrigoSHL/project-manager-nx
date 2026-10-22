import { useState } from 'react';
import { ResponsiveFilters } from '../../../components/responsive-filters';
import type { Site, Tenant } from '../../assets/models';
import type { AssetType } from '../../asset-types/models';
import type { WorkType } from '../../work-types/models';
import {
  presetDates,
  type DashboardFilterValues,
  type PeriodPreset,
} from '../dashboard-filters';

type Props = {
  label?: string;
  showTypeFilters?: boolean;
  emptySiteLabel?: string;
  filters: DashboardFilterValues;
  tenants: Tenant[];
  tenantId: string;
  sites: Site[];
  workTypes: WorkType[];
  assetTypes: AssetType[];
  loadingOptions: boolean;
  optionsError: string | null;
  onTenantChange: (tenantId: string) => void;
  onChange: (change: Partial<DashboardFilterValues>) => void;
  onApply: (tenantId: string, filters: DashboardFilterValues) => void;
};

const periodLabels: Record<PeriodPreset, string> = {
  '30d': 'Últimos 30 días',
  '3m': 'Últimos 3 meses',
  '6m': 'Últimos 6 meses',
  '12m': 'Últimos 12 meses',
  custom: 'Personalizado',
};
const inputClass =
  'mt-1.5 min-h-11 w-full min-w-0 max-w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-base text-slate-900 dark:text-slate-100 focus:border-slate-500 dark:focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-800 disabled:bg-slate-50 dark:disabled:bg-slate-950 md:text-sm';

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0 text-sm font-medium text-slate-700 dark:text-slate-200">
      {label}
      {children}
    </label>
  );
}

function FilterFields({
  filters,
  tenants,
  tenantId,
  sites,
  workTypes,
  assetTypes,
  loadingOptions,
  onTenantChange,
  onChange,
  showTypeFilters = true,
  emptySiteLabel = 'Todas las faenas',
}: Omit<Props, 'optionsError' | 'onApply'>) {
  return (
    <>
      <div
        className={
          showTypeFilters
            ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-5'
            : 'grid gap-4 md:grid-cols-3'
        }
      >
        {tenants.length > 1 ? (
          <Field label="Empresa">
            <select
              className={inputClass}
              value={tenantId}
              onChange={(event) => onTenantChange(event.target.value)}
            >
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <div className="min-w-0 text-sm text-slate-600 dark:text-slate-300">
            Empresa
            <p className="mt-1.5 break-words font-medium text-slate-900 dark:text-slate-100">
              {tenants[0]?.name ?? 'Sin empresa disponible'}
            </p>
          </div>
        )}
        <Field label="Faena">
          <select
            className={inputClass}
            value={filters.siteId ?? ''}
            onChange={(event) => onChange({ siteId: event.target.value })}
            disabled={loadingOptions}
          >
            <option value="">{emptySiteLabel}</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Período">
          <select
            className={inputClass}
            value={filters.period}
            onChange={(event) =>
              onChange({ period: event.target.value as PeriodPreset })
            }
          >
            {Object.entries(periodLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        {showTypeFilters ? (
          <Field label="Tipo de trabajo">
            <select
              className={inputClass}
              value={filters.workTypeId ?? ''}
              onChange={(event) => onChange({ workTypeId: event.target.value })}
              disabled={loadingOptions}
            >
              <option value="">Todos los tipos</option>
              {workTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
        {showTypeFilters ? (
          <Field label="Tipo de activo">
            <select
              className={inputClass}
              value={filters.assetTypeId ?? ''}
              onChange={(event) =>
                onChange({ assetTypeId: event.target.value })
              }
              disabled={loadingOptions}
            >
              <option value="">Todos los tipos</option>
              {assetTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
      </div>
      {filters.period === 'custom' && (
        <div className="mt-4 grid min-w-0 gap-4 md:max-w-lg md:grid-cols-2">
          <Field label="Desde">
            <input
              className={inputClass}
              type="date"
              value={filters.from}
              max={filters.to}
              onChange={(event) => onChange({ from: event.target.value })}
            />
          </Field>
          <Field label="Hasta">
            <input
              className={inputClass}
              type="date"
              value={filters.to}
              min={filters.from}
              onChange={(event) => onChange({ to: event.target.value })}
            />
          </Field>
        </div>
      )}
    </>
  );
}

export function DashboardFilters(props: Props) {
  const {
    filters,
    tenants,
    tenantId,
    sites,
    workTypes,
    assetTypes,
    optionsError,
  } = props;
  const [draft, setDraft] = useState(filters);
  const [draftTenantId, setDraftTenantId] = useState(tenantId);
  const changingTenant = draftTenantId !== tenantId;
  const datesValid = Boolean(draft.from && draft.to && draft.from <= draft.to);
  const selectedTenant = tenants.find((tenant) => tenant.id === tenantId);
  const activeNames = [
    filters.workTypeId
      ? workTypes.find((type) => type.id === filters.workTypeId)?.name ??
        'Tipo de trabajo seleccionado'
      : null,
    filters.assetTypeId
      ? assetTypes.find((type) => type.id === filters.assetTypeId)?.name ??
        'Tipo de activo seleccionado'
      : null,
  ].filter(Boolean);
  const dateLabel = `${shortDate(filters.from)} – ${shortDate(filters.to)}`;
  function changeDraft(change: Partial<DashboardFilterValues>) {
    setDraft((current) => ({
      ...current,
      ...(change.period && change.period !== 'custom'
        ? presetDates(change.period)
        : {}),
      ...change,
    }));
  }
  return (
    <>
      <ResponsiveFilters
        label={props.label ?? 'Filtros del resumen'}
        activeCount={
          [filters.siteId, filters.workTypeId, filters.assetTypeId].filter(
            Boolean
          ).length + (filters.period !== '6m' ? 1 : 0)
        }
        summary={
          <>
            <p className="font-medium text-slate-900 dark:text-slate-100">{selectedTenant?.name}</p>
            <p className="mt-1">
              {sites.find((site) => site.id === filters.siteId)?.name ??
                (filters.siteId
                  ? 'Faena seleccionada'
                  : props.emptySiteLabel ?? 'Todas las faenas')}{' '}
              · {periodLabels[filters.period]}
            </p>
            {activeNames.length > 0 ? (
              <p className="mt-1 text-xs">{activeNames.join(' · ')}</p>
            ) : null}
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{dateLabel}</p>
          </>
        }
        onOpen={() => {
          setDraft(filters);
          setDraftTenantId(tenantId);
        }}
        onReset={() => setDraft({ period: '6m', ...presetDates('6m') })}
        onApply={() => props.onApply(draftTenantId, draft)}
        canApply={
          datesValid && tenants.some((tenant) => tenant.id === draftTenantId)
        }
        mobileContent={
          <>
            <FilterFields
              {...props}
              filters={draft}
              tenantId={draftTenantId}
              sites={changingTenant ? [] : sites}
              workTypes={changingTenant ? [] : workTypes}
              assetTypes={changingTenant ? [] : assetTypes}
              loadingOptions={props.loadingOptions || changingTenant}
              onTenantChange={(next) => {
                setDraftTenantId(next);
                setDraft((current) => ({
                  ...current,
                  siteId: '',
                  workTypeId: '',
                  assetTypeId: '',
                }));
              }}
              onChange={changeDraft}
            />
            {changingTenant ? (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Al cambiar de empresa, se restablecen la faena y los tipos.
                Aplica la selección para consultar la nueva empresa.
              </p>
            ) : null}
            {!datesValid ? (
              <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
                Selecciona un período válido: la fecha inicial debe ser anterior
                o igual a la final.
              </p>
            ) : null}
          </>
        }
      >
        <FilterFields {...props} />
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{dateLabel}</p>
      </ResponsiveFilters>
      {optionsError ? (
        <p role="alert" className="mt-3 text-sm text-amber-700 dark:text-amber-300">
          No se pudieron cargar las opciones de filtros. {optionsError}
        </p>
      ) : null}
    </>
  );
}
function shortDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
