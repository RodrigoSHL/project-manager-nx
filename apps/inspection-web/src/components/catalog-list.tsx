import { Check, Pencil, Power, RotateCcw } from 'lucide-react';

type CatalogListItem = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  active: boolean;
};

type CatalogListProps = {
  items: CatalogListItem[];
  emptyMessage: string;
  layout?: 'cards' | 'list';
  selectedId?: string | null;
  isMutating?: boolean;
  onEdit?: (item: CatalogListItem) => void;
  onSelect?: (item: CatalogListItem) => void;
  onToggleActive?: (item: CatalogListItem) => void;
  canToggleActive?: (item: CatalogListItem) => boolean;
};

export function CatalogList({
  items,
  emptyMessage,
  layout = 'cards',
  selectedId,
  isMutating = false,
  onEdit,
  onSelect,
  onToggleActive,
  canToggleActive = () => true,
}: CatalogListProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div
      className={
        layout === 'list'
          ? 'grid min-w-0 gap-2'
          : 'grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3'
      }
    >
      {items.map((item) => {
        const isSelected = selectedId === item.id;
        const toggleAllowed = canToggleActive(item);

        return (
          <article
            key={item.id}
            className={`relative min-w-0 overflow-hidden rounded-xl border bg-white transition ${
              layout === 'list' ? 'p-3' : 'p-4'
            } ${
              isSelected
                ? 'border-slate-900 bg-slate-50/70 shadow-sm ring-1 ring-slate-900'
                : 'border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md'
            }`}
          >
            {onSelect ? (
              <button
                type="button"
                aria-label={`Seleccionar ${item.name}`}
                aria-pressed={isSelected}
                onClick={() => onSelect(item)}
                className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 focus-visible:ring-inset"
              />
            ) : null}

            <div
              className={`pointer-events-none relative z-10 min-w-0 ${
                layout === 'list'
                  ? 'flex items-center gap-3'
                  : 'flex h-full flex-col'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    title={item.code}
                    className="min-w-0 truncate rounded bg-slate-100 px-2 py-1 font-mono text-[0.7rem] font-semibold text-slate-600"
                  >
                    {item.code}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[0.7rem] font-medium ${
                      item.active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <h3
                  className={`truncate font-semibold text-slate-950 ${
                    layout === 'list' ? 'mt-2 text-sm' : 'mt-4'
                  }`}
                  title={item.name}
                >
                  {item.name}
                </h3>
                <p
                  className={`text-sm leading-5 text-slate-500 ${
                    layout === 'list' ? 'mt-0.5 truncate' : 'mt-1 line-clamp-2'
                  }`}
                  title={item.description ?? 'Sin descripción.'}
                >
                  {item.description ?? 'Sin descripción.'}
                </p>
              </div>

              <div
                className={`pointer-events-auto flex shrink-0 items-center gap-1 ${
                  layout === 'cards'
                    ? 'mt-4 border-t border-slate-100 pt-3'
                    : ''
                }`}
              >
                {isSelected && onSelect ? (
                  <span
                    className="mr-1 hidden size-7 place-items-center rounded-full bg-slate-900 text-white sm:grid"
                    title="Tipo seleccionado"
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                ) : null}
                {onEdit ? (
                  <button
                    type="button"
                    aria-label={`Editar ${item.name}`}
                    title="Editar"
                    onClick={() => onEdit(item)}
                    className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                  >
                    <Pencil className="size-4" />
                  </button>
                ) : null}
                {onToggleActive ? (
                  <button
                    type="button"
                    disabled={isMutating || !toggleAllowed}
                    aria-label={`${item.active ? 'Desactivar' : 'Activar'} ${
                      item.name
                    }`}
                    title={
                      toggleAllowed
                        ? item.active
                          ? 'Desactivar'
                          : 'Activar'
                        : 'Este tipo es necesario para los nodos raíz'
                    }
                    onClick={() => onToggleActive(item)}
                    className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    {item.active ? (
                      <Power className="size-4" />
                    ) : (
                      <RotateCcw className="size-4" />
                    )}
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
