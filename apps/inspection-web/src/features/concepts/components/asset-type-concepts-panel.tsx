import { BookOpenText } from 'lucide-react';
import type { AssetType } from '../../asset-types/models';
import { conceptTypeLabels } from '../concept-schema';
import { useConceptCatalog } from '../use-concept-catalog';

type AssetTypeConceptsPanelProps = {
  tenantId: string;
  assetType: AssetType;
  assetTypes: AssetType[];
};

export function AssetTypeConceptsPanel({
  tenantId,
  assetType,
  assetTypes,
}: AssetTypeConceptsPanelProps) {
  const { concepts, assetTypeConcepts, setAssetTypeAssociation } =
    useConceptCatalog(tenantId, assetTypes);
  const associatedIds = new Set(
    assetTypeConcepts
      .filter(
        (relation) => relation.assetTypeId === assetType.id && relation.active
      )
      .map((relation) => relation.conceptId)
  );

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:flex lg:max-h-[calc(100vh-10rem)] lg:flex-col">
      <header className="shrink-0 border-b border-slate-200 p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
            <BookOpenText className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500">
              Conceptos disponibles
            </p>
            <h3 className="mt-0.5 truncate font-semibold text-slate-950">
              {assetType.name}
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Define qué datos podrá utilizar este tipo de equipo más adelante.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
            {associatedIds.size}/{concepts.length}
          </span>
        </div>
      </header>

      <div className="min-w-0 p-3 sm:p-4 lg:flex-1 lg:overflow-y-auto">
        <div className="divide-y divide-slate-100">
          {concepts.map((concept) => {
            const associated = associatedIds.has(concept.id);
            const cannotAssociate =
              (!concept.active || !assetType.active) && !associated;
            return (
              <label
                key={concept.id}
                className={`grid min-w-0 cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-2 py-3 transition hover:bg-slate-50 ${
                  cannotAssociate ? 'cursor-not-allowed opacity-60' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={associated}
                  disabled={cannotAssociate}
                  onChange={(event) =>
                    setAssetTypeAssociation(
                      assetType,
                      concept.id,
                      event.target.checked
                    )
                  }
                  className="size-4 accent-slate-950"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-800">
                    {concept.name}
                  </span>
                  <span className="block truncate font-mono text-[0.7rem] text-slate-500">
                    {concept.code}
                  </span>
                </span>
                <span className="text-right text-xs text-slate-500">
                  {conceptTypeLabels[concept.type]}
                  {concept.unit ? ` · ${concept.unit}` : ''}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </section>
  );
}
