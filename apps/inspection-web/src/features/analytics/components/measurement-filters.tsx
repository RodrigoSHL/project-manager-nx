import type { AssetType } from '../../asset-types/models';
import type { Site, Tenant } from '../../assets/models';
import type { WorkType } from '../../work-types/models';
import type { DashboardFilterValues, PeriodPreset } from '../dashboard-filters';
import type { AnalyticsConcept } from '../models';

type Props = {
  filters: DashboardFilterValues;
  tenants: Tenant[];
  tenantId: string;
  sites: Site[];
  workTypes: WorkType[];
  assetTypes: AssetType[];
  concepts: AnalyticsConcept[];
  conceptId: string;
  loadingOptions: boolean;
  loadingConcepts: boolean;
  optionsError: string | null;
  onTenantChange: (id: string) => void;
  onConceptChange: (id: string) => void;
  onChange: (change: Partial<DashboardFilterValues>) => void;
};

const inputClass =
  'mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200';

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}

export function MeasurementFilters({
  filters,
  tenants,
  tenantId,
  sites,
  workTypes,
  assetTypes,
  concepts,
  conceptId,
  loadingOptions,
  loadingConcepts,
  optionsError,
  onTenantChange,
  onConceptChange,
  onChange,
}: Props) {
  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      aria-label="Filtros de mediciones"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Field label="Tenant / Empresa">
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
        <Field label="Faena / Sitio">
          <select
            className={inputClass}
            value={filters.siteId ?? ''}
            onChange={(event) => onChange({ siteId: event.target.value })}
            disabled={loadingOptions}
          >
            <option value="">Todas las faenas</option>
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Concepto analógico">
          <select
            className={inputClass}
            value={
              concepts.some((item) => item.id === conceptId) ? conceptId : ''
            }
            onChange={(event) => onConceptChange(event.target.value)}
            disabled={loadingConcepts}
            required
          >
            <option value="">Selecciona un concepto</option>
            {concepts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.unit ? ` (${item.unit})` : ''} · {item.measurementCount}{' '}
                mediciones
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tipo de activo">
          <select
            className={inputClass}
            value={filters.assetTypeId ?? ''}
            onChange={(event) => onChange({ assetTypeId: event.target.value })}
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
        <Field label="Período">
          <select
            className={inputClass}
            value={filters.period}
            onChange={(event) =>
              onChange({ period: event.target.value as PeriodPreset })
            }
          >
            <option value="30d">Últimos 30 días</option>
            <option value="3m">Últimos 3 meses</option>
            <option value="6m">Últimos 6 meses</option>
            <option value="12m">Últimos 12 meses</option>
            <option value="custom">Personalizado</option>
          </select>
        </Field>
      </div>
      {filters.period === 'custom' && (
        <div className="mt-4 grid gap-4 sm:max-w-lg sm:grid-cols-2">
          <Field label="Desde">
            <input
              type="date"
              className={inputClass}
              value={filters.from}
              max={filters.to}
              onChange={(event) => onChange({ from: event.target.value })}
            />
          </Field>
          <Field label="Hasta">
            <input
              type="date"
              className={inputClass}
              value={filters.to}
              min={filters.from}
              onChange={(event) => onChange({ to: event.target.value })}
            />
          </Field>
        </div>
      )}
      {optionsError && (
        <p role="alert" className="mt-3 text-sm text-amber-700">
          No se cargaron todos los catálogos: {optionsError}
        </p>
      )}
      <p className="mt-3 text-xs text-slate-500">
        Mediciones registradas del {filters.from} al {filters.to}. Cada punto
        corresponde a una inspección, no a telemetría continua.
      </p>
    </section>
  );
}
