import { BookOpenText } from 'lucide-react';
import type { AssetType } from '../../asset-types/models';
import type { Asset } from '../../assets/models';
import { conceptTypeLabels } from '../concept-schema';
import { useConceptCatalog } from '../use-concept-catalog';

type AvailableConceptsProps = {
  asset: Asset;
  assetTypes: AssetType[];
};

export function AvailableConcepts({
  asset,
  assetTypes,
}: AvailableConceptsProps) {
  const { listAvailableForAssetType } = useConceptCatalog(
    asset.tenantId,
    assetTypes
  );
  const concepts = listAvailableForAssetType(asset.assetTypeId);

  return (
    <section className="mt-6 border-t border-slate-200 pt-5">
      <div className="flex items-center gap-2">
        <BookOpenText className="size-4 text-slate-500" />
        <h3 className="font-semibold text-slate-900">
          Conceptos disponibles para este tipo
        </h3>
      </div>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        Son definiciones reutilizables; todavía no contienen valores
        registrados.
      </p>

      {concepts.length === 0 ? (
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
          Este tipo de activo no tiene conceptos asociados.
        </p>
      ) : (
        <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 px-3">
          {concepts.map((concept) => (
            <div
              key={concept.id}
              className="grid min-w-0 gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">
                  {concept.name}
                </p>
                {concept.type === 'DIGITAL' ? (
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">
                    {concept.options.map((option) => option.label).join(' · ')}
                  </p>
                ) : null}
              </div>
              <span className="text-xs font-medium text-slate-500">
                {conceptTypeLabels[concept.type]}
                {concept.unit ? ` · ${concept.unit}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
