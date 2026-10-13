import { useState } from 'react';
import type { MeasurementSeries } from '../models';
import { MAX_ASSET_SERIES, toggleAssetId } from '../measurement-comparison';

export function MeasurementAssets({
  candidates,
  selectedIds,
  onChange,
}: {
  candidates: MeasurementSeries[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const showSearch = candidates.length > MAX_ASSET_SERIES;
  const visible = candidates.filter((asset) =>
    asset.assetName
      .toLocaleLowerCase('es')
      .includes(showSearch ? search.toLocaleLowerCase('es') : '')
  );
  return (
    <section
      className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-5"
      aria-label="Seleccionar activos para comparar"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-950 md:text-lg">
          Activos con historial
        </h2>
        <span className="text-xs text-slate-500">
          {selectedIds.length}/{MAX_ASSET_SERIES} seleccionados
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Selecciona hasta {MAX_ASSET_SERIES} activos para mantener el gráfico
        legible.
      </p>
      {showSearch ? (
        <input
          type="search"
          aria-label="Buscar activo"
          placeholder="Buscar activo..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="mt-3 min-h-11 w-full min-w-0 rounded-lg border border-slate-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-slate-300 md:text-sm"
        />
      ) : null}
      <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
        {visible.map((asset) => {
          const checked = selectedIds.includes(asset.assetId);
          return (
            <label
              key={asset.assetId}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={!checked && selectedIds.length >= MAX_ASSET_SERIES}
                onChange={() =>
                  onChange(toggleAssetId(selectedIds, asset.assetId))
                }
                className="size-5 shrink-0 accent-slate-950"
              />
              <span className="min-w-0 flex-1 break-words text-sm font-medium text-slate-800">
                {asset.assetName}
              </span>
              <span className="shrink-0 text-xs text-slate-500">
                {asset.statistics.count} mediciones
              </span>
            </label>
          );
        })}
        {!visible.length && (
          <p className="py-5 text-center text-sm text-slate-500">
            No hay activos con historial para esta búsqueda y filtros.
          </p>
        )}
      </div>
    </section>
  );
}
