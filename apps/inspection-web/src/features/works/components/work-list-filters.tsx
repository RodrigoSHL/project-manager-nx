import { useState } from 'react';
import { ResponsiveFilters } from '../../../components/responsive-filters';
import type { Asset, Site, Tenant } from '../../assets/models';
import type { WorkType } from '../../work-types/models';
import type { WorkStatus } from '../models';
import { workStatusLabels } from '../work-formatters';

export type WorkListFilterValues = {
  tenantId: string;
  siteId: string;
  assetId: string;
  workTypeId: string;
  status: string;
};

export const emptyWorkFilters = {
  siteId: '',
  assetId: '',
  workTypeId: '',
  status: '',
};

type Props = {
  values: WorkListFilterValues;
  tenants: Tenant[];
  sites: Site[];
  assets: Asset[];
  workTypes: WorkType[];
  loading: boolean;
  onChange: (values: WorkListFilterValues) => void;
};

function Fields({
  values,
  tenants,
  sites,
  assets,
  workTypes,
  loading,
  onChange,
}: Props) {
  function update(change: Partial<WorkListFilterValues>) {
    onChange(
      change.tenantId !== undefined && change.tenantId !== values.tenantId
        ? { tenantId: change.tenantId, ...emptyWorkFilters }
        : {
            ...values,
            ...(change.siteId !== undefined && change.siteId !== values.siteId
              ? { assetId: '' }
              : {}),
            ...change,
          }
    );
  }
  const availableAssets = assets.filter(
    (asset) => !values.siteId || asset.siteId === values.siteId
  );
  const fields = [
    {
      label: 'Faena',
      key: 'siteId' as const,
      all: 'Todas las faenas',
      options: sites.map((site) => ({ id: site.id, label: site.name })),
    },
    {
      label: 'Activo',
      key: 'assetId' as const,
      all: 'Todos los activos',
      options: availableAssets.map((asset) => ({
        id: asset.id,
        label: `${asset.code} · ${asset.name}`,
      })),
    },
    {
      label: 'Tipo de trabajo',
      key: 'workTypeId' as const,
      all: 'Todos los tipos',
      options: workTypes.map((type) => ({ id: type.id, label: type.name })),
    },
    {
      label: 'Estado',
      key: 'status' as const,
      all: 'Todos los estados',
      options: Object.entries(workStatusLabels).map(([id, label]) => ({
        id,
        label,
      })),
    },
  ];
  const inputClass =
    'mt-1.5 min-h-11 w-full min-w-0 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-base font-normal text-slate-800 dark:text-slate-200 outline-none focus:border-slate-500 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-800 disabled:bg-slate-50 dark:disabled:bg-slate-950 md:text-sm';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {tenants.length > 1 ? (
        <label className="min-w-0 text-sm font-medium text-slate-600 dark:text-slate-300">
          Empresa
          <select
            className={inputClass}
            value={values.tenantId}
            onChange={(event) => update({ tenantId: event.target.value })}
          >
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div className="min-w-0 text-sm text-slate-600 dark:text-slate-300">
          Empresa
          <p className="mt-1.5 break-words font-medium text-slate-900 dark:text-slate-100">
            {tenants[0]?.name ?? 'Sin empresa disponible'}
          </p>
        </div>
      )}
      {fields.map(({ label, key, all, options }) => (
        <label key={key} className="min-w-0 text-sm font-medium text-slate-600 dark:text-slate-300">
          {label}
          <select
            className={inputClass}
            value={values[key]}
            disabled={loading && key !== 'status'}
            onChange={(event) => update({ [key]: event.target.value })}
          >
            <option value="">{all}</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}

export function WorkListFilters(props: Props) {
  const { values, tenants, sites, assets, workTypes } = props;
  const [draft, setDraft] = useState(values);
  const changingTenant = draft.tenantId !== values.tenantId;
  const names = [
    values.assetId
      ? assets.find((asset) => asset.id === values.assetId)?.name ??
        'Activo seleccionado'
      : null,
    values.workTypeId
      ? workTypes.find((type) => type.id === values.workTypeId)?.name ??
        'Tipo de trabajo seleccionado'
      : null,
    values.status ? workStatusLabels[values.status as WorkStatus] : null,
  ].filter(Boolean);

  return (
    <ResponsiveFilters
      label="Filtros de trabajos"
      activeCount={
        [
          values.siteId,
          values.assetId,
          values.workTypeId,
          values.status,
        ].filter(Boolean).length
      }
      summary={
        <>
          <p className="font-medium text-slate-900 dark:text-slate-100">
            {tenants.find((tenant) => tenant.id === values.tenantId)?.name}
          </p>
          <p className="mt-1">
            {sites.find((site) => site.id === values.siteId)?.name ??
              (values.siteId ? 'Faena seleccionada' : 'Todas las faenas')}
          </p>
          {names.length ? (
            <p className="mt-1 text-xs">{names.join(' · ')}</p>
          ) : null}
        </>
      }
      onOpen={() => setDraft(values)}
      onReset={() =>
        setDraft({ tenantId: draft.tenantId, ...emptyWorkFilters })
      }
      onApply={() => props.onChange(draft)}
      canApply={tenants.some((tenant) => tenant.id === draft.tenantId)}
      mobileContent={
        <>
          <Fields
            {...props}
            values={draft}
            onChange={setDraft}
            sites={changingTenant ? [] : sites}
            assets={changingTenant ? [] : assets}
            workTypes={changingTenant ? [] : workTypes}
            loading={props.loading || changingTenant}
          />
          {changingTenant ? (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Al cambiar de empresa, se restablecen la faena y los tipos. Aplica
              la selección para consultar la nueva empresa.
            </p>
          ) : null}
        </>
      }
    >
      <Fields {...props} />
    </ResponsiveFilters>
  );
}
