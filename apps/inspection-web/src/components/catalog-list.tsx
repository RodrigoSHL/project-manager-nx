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
};

export function CatalogList({ items, emptyMessage }: CatalogListProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-600">
              {item.code}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                item.active
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {item.active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <h3 className="mt-4 font-semibold text-slate-950">{item.name}</h3>
          <p className="mt-1 text-sm leading-5 text-slate-500">
            {item.description ?? 'Sin descripción.'}
          </p>
        </article>
      ))}
    </div>
  );
}
