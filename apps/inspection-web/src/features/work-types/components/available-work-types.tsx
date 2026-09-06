import { Check, Wrench } from 'lucide-react';
import type { Asset } from '../../assets/models';
import { useEffectiveWorkTypes } from '../use-effective-work-types';

type AvailableWorkTypesProps = {
  asset: Asset;
};

export function AvailableWorkTypes({ asset }: AvailableWorkTypesProps) {
  const { error, isLoading, workTypes } = useEffectiveWorkTypes(asset);

  return (
    <section className="mt-6 border-t border-slate-200 pt-5">
      <div className="flex items-center gap-2">
        <Wrench className="size-4 text-slate-500" />
        <h3 className="font-semibold text-slate-900">
          Tipos de trabajo disponibles
        </h3>
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Configuración disponible; todavía no existen trabajos realizados.
      </p>

      {isLoading ? (
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
          Cargando configuración...
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!isLoading && !error && workTypes.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {workTypes.map((workType) => (
            <li
              key={workType.id}
              className="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-2.5"
            >
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="size-3.5" strokeWidth={3} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-800">
                  {workType.name}
                </span>
                <span className="block text-xs text-slate-500">
                  {workType.source === 'ASSET'
                    ? 'Excepción configurada para este activo'
                    : 'Habilitado por su tipo de activo'}
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {!isLoading && !error && workTypes.length === 0 ? (
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
          No hay tipos de trabajo habilitados para este activo.
        </p>
      ) : null}
    </section>
  );
}
