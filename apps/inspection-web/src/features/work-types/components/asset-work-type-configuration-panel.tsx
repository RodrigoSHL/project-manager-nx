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
    <section className="mt-6 border-t border-slate-200 pt-5">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="size-4 text-slate-500" />
        <h3 className="font-semibold text-slate-900">
          Excepciones de este activo
        </h3>
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Heredar usa la regla de su tipo. Permitir o bloquear afecta solamente a
        este equipo.
      </p>

      {isLoading ? (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
          <LoaderCircle className="size-4 animate-spin" /> Cargando reglas...
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!isLoading && configurations.length > 0 ? (
        <div className="mt-3 divide-y divide-slate-100 border-y border-slate-100">
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
                  <p className="text-sm font-medium text-slate-800">
                    {configuration.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Regla del tipo:{' '}
                    {configuration.typeEnabled ? 'permitido' : 'no permitido'} ·{' '}
                    Resultado:{' '}
                    <span
                      className={
                        configuration.effectiveEnabled
                          ? 'font-medium text-emerald-700'
                          : 'font-medium text-slate-600'
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
                  className="h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-800 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
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
