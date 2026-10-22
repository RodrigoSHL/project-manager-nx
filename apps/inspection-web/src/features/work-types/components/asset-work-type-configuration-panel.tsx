import { LoaderCircle, SlidersHorizontal } from 'lucide-react';
import type { Asset } from '../../assets/models';
import {
  useAssetWorkTypeConfiguration,
  type WorkTypeOverrideValue,
} from '../use-asset-work-type-configuration';

type AssetWorkTypeConfigurationPanelProps = {
  asset: Asset;
  onChange: () => void;
};

export function AssetWorkTypeConfigurationPanel({
  asset,
  onChange,
}: AssetWorkTypeConfigurationPanelProps) {
  const { configurations, error, isLoading, mutatingId, setOverride } =
    useAssetWorkTypeConfiguration(asset);

  async function changeOverride(
    workTypeId: string,
    value: WorkTypeOverrideValue
  ) {
    if (await setOverride(workTypeId, value)) onChange();
  }

  return (
    <section className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-5">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="size-4 text-slate-500 dark:text-slate-400" />
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
          Excepciones de este activo
        </h3>
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
        Heredar usa la regla de su tipo. Permitir o bloquear afecta solamente a
        este equipo.
      </p>

      {isLoading ? (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-950 p-3 text-sm text-slate-500 dark:text-slate-400">
          <LoaderCircle className="size-4 animate-spin" /> Cargando reglas...
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {!isLoading && configurations.length > 0 ? (
        <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800 border-y border-slate-100 dark:border-slate-800">
          {configurations.map((configuration) => {
            const value: WorkTypeOverrideValue =
              configuration.override === null
                ? 'INHERIT'
                : configuration.override
                ? 'ALLOW'
                : 'BLOCK';
            return (
              <div
                key={configuration.id}
                className="grid gap-2 py-3 sm:grid-cols-[1fr_9.5rem] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {configuration.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Regla del tipo:{' '}
                    {configuration.typeEnabled ? 'permitido' : 'no permitido'} ·{' '}
                    Resultado:{' '}
                    <span
                      className={
                        configuration.effectiveEnabled
                          ? 'font-medium text-emerald-700 dark:text-emerald-300'
                          : 'font-medium text-slate-600 dark:text-slate-300'
                      }
                    >
                      {configuration.effectiveEnabled
                        ? 'habilitado'
                        : 'deshabilitado'}
                    </span>
                  </p>
                </div>
                <select
                  aria-label={`Regla para ${configuration.name}`}
                  value={value}
                  disabled={mutatingId === configuration.id}
                  onChange={(event) =>
                    void changeOverride(
                      configuration.id,
                      event.target.value as WorkTypeOverrideValue
                    )
                  }
                  className="h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm text-slate-800 dark:text-slate-200 outline-none focus:border-slate-500 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-800"
                >
                  <option value="INHERIT">Heredar</option>
                  <option value="ALLOW" disabled={!configuration.active}>
                    Permitir
                  </option>
                  <option value="BLOCK" disabled={!configuration.active}>
                    Bloquear
                  </option>
                </select>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
