import { Link2, LoaderCircle } from 'lucide-react';
import type { AssetType } from '../../asset-types/models';
import type { WorkType } from '../models';
import { useAssetTypeWorkTypes } from '../use-asset-type-work-types';

type AssetTypeWorkTypesPanelProps = {
  tenantId: string;
  assetType: AssetType;
  workTypes: WorkType[];
};

export function AssetTypeWorkTypesPanel({
  tenantId,
  assetType,
  workTypes: catalogWorkTypes,
}: AssetTypeWorkTypesPanelProps) {
  const catalogVersion = catalogWorkTypes
    .map((item) => `${item.id}:${item.active}:${item.name}`)
    .join('|');
  const { error, isLoading, mutatingId, setAssociated, workTypes } =
    useAssetTypeWorkTypes(tenantId, assetType.id, catalogVersion);
  const associatedCount = workTypes.filter((item) => item.associated).length;

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:flex lg:max-h-[calc(100vh-7rem)] lg:flex-col">
      <header className="shrink-0 border-b border-slate-200 p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
            <Link2 className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500">
              Trabajos heredados
            </p>
            <h3
              className="mt-0.5 truncate font-semibold text-slate-950"
              title={assetType.name}
            >
              {assetType.name}
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Se aplican a todos los activos de este tipo, salvo excepciones
              particulares.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
            {associatedCount}/{workTypes.length}
          </span>
        </div>
      </header>

      <div className="min-w-0 p-3 sm:p-4 lg:flex-1 lg:overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
            <LoaderCircle className="size-4 animate-spin" /> Cargando
            asociaciones...
          </div>
        ) : null}

        {error ? (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {!isLoading && workTypes.length === 0 ? (
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
            Crea primero un tipo de trabajo para poder asociarlo.
          </p>
        ) : null}

        {!isLoading && workTypes.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {workTypes.map((workType) => {
              const cannotAssociate =
                (!workType.active || !assetType.active) && !workType.associated;
              return (
                <label
                  key={workType.id}
                  className={`grid min-w-0 cursor-pointer grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-lg px-2 py-3 transition hover:bg-slate-50 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center ${
                    cannotAssociate ? 'cursor-not-allowed opacity-60' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={workType.associated}
                    disabled={mutatingId === workType.id || cannotAssociate}
                    onChange={(event) =>
                      void setAssociated(workType.id, event.target.checked)
                    }
                    className="mt-0.5 size-4 shrink-0 accent-slate-950 sm:mt-0"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {workType.name}
                    </span>
                    <span
                      className="block truncate font-mono text-[0.7rem] text-slate-500"
                      title={workType.code}
                    >
                      {workType.code}
                    </span>
                  </span>
                  <span
                    className={`col-start-2 w-fit text-xs font-medium sm:col-start-3 sm:row-start-1 ${
                      workType.active
                        ? workType.associated
                          ? 'text-emerald-700'
                          : 'text-slate-500'
                        : 'text-amber-700'
                    }`}
                  >
                    {!workType.active
                      ? 'Inactivo'
                      : workType.associated
                      ? 'Habilitado'
                      : 'No asociado'}
                  </span>
                </label>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
