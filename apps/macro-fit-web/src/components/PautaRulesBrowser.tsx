import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import {
  PAUTA_GROUPS,
  PAUTA_LABELS,
  PautaGroup,
  PautaRule,
  QUANTITY_LABELS,
  formatPortions,
} from '../types/nutrition';

const PAGE_SIZE = 12;
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
const control =
  'min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400';
const action =
  'flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

export function PautaRulesBrowser({
  rules,
  onEdit,
  onRemove,
}: {
  rules: PautaRule[];
  onEdit: (rule: PautaRule) => void;
  onRemove: (rule: PautaRule) => void;
}) {
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState<PautaGroup | 'free' | ''>('');
  const [unit, setUnit] = useState('');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [page, setPage] = useState(1);
  const resultsRef = useRef<HTMLUListElement>(null);
  const groupCounts = Object.fromEntries(
    PAUTA_GROUPS.map((item) => [
      item,
      rules.filter((rule) =>
        rule.contributions.some((contribution) => contribution.group === item)
      ).length,
    ])
  ) as Record<PautaGroup, number>;
  const freeCount = rules.filter((rule) => rule.free).length;
  const query = normalize(search);
  const filtered = rules
    .filter(
      (rule) =>
        (!group ||
          (group === 'free'
            ? rule.free
            : rule.contributions.some((item) => item.group === group))) &&
        (!unit || rule.unit === unit) &&
        (!query ||
          [rule.name, ...rule.aliases].some((value) =>
            normalize(value).includes(query)
          ))
    )
    .sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base', numeric: true })
    );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  useEffect(
    () => setPage((value) => Math.min(value, totalPages)),
    [totalPages]
  );
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRules = filtered.slice(start, start + PAGE_SIZE);
  const hasFilters = !!(search || group || unit);
  const clear = () => {
    setSearch('');
    setGroup('');
    setUnit('');
    setPage(1);
  };
  const goToPage = (next: number) => {
    setPage(next);
    resultsRef.current?.scrollIntoView?.({
      behavior: 'smooth',
      block: 'start',
    });
    resultsRef.current?.focus({ preventScroll: true });
  };
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_190px_180px]">
        <label className="block text-xs text-slate-400 sm:col-span-2 lg:col-span-1">
          Buscar equivalencias
          <span className="mt-1 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 focus-within:ring-2 focus-within:ring-emerald-400">
            <Search size={17} className="shrink-0" aria-hidden />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Nombre, alias o preparación…"
              className="min-h-11 min-w-0 w-full bg-transparent py-2 text-sm text-slate-100 outline-none"
            />
          </span>
        </label>
        <label className="block text-xs text-slate-400">
          Grupo de aporte
          <select
            value={group}
            onChange={(e) => {
              setGroup(e.target.value as typeof group);
              setPage(1);
            }}
            className={`mt-1 ${control}`}
          >
            <option value="">Todos los grupos</option>
            {PAUTA_GROUPS.filter(
              (item) => groupCounts[item] || group === item
            ).map((item) => (
              <option key={item} value={item}>
                {PAUTA_LABELS[item]} ({groupCounts[item]})
              </option>
            ))}
            <option value="free">Alimentos libres ({freeCount})</option>
          </select>
        </label>
        <label className="block text-xs text-slate-400">
          Unidad de referencia
          <select
            value={unit}
            onChange={(e) => {
              setUnit(e.target.value);
              setPage(1);
            }}
            className={`mt-1 ${control}`}
          >
            <option value="">Todas las unidades</option>
            {Object.entries(QUANTITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-3">
          <p role="status" className="text-xs text-slate-400">
            {filtered.length
              ? `${start + 1}–${Math.min(
                  start + PAGE_SIZE,
                  filtered.length
                )} de ${filtered.length}`
              : '0'}{' '}
            equivalencias{hasFilters ? ` · ${rules.length} en tu pauta` : ''}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clear}
              className="flex min-h-11 items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
            >
              <RotateCcw size={14} aria-hidden />
              Limpiar filtros
            </button>
          )}
        </div>
        <div
          role="group"
          aria-label="Vista de equivalencias"
          className="flex gap-1 rounded-xl border border-slate-700 bg-slate-950 p-1"
        >
          {(
            [
              { value: 'list', label: 'Vista de lista', Icon: List },
              { value: 'grid', label: 'Vista de cuadrícula', Icon: LayoutGrid },
            ] as const
          ).map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={view === value}
              onClick={() => setView(value)}
              className={`flex size-10 items-center justify-center rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300 ${
                view === value
                  ? 'bg-emerald-400 text-slate-950'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={19} aria-hidden />
            </button>
          ))}
        </div>
      </div>
      <ul
        ref={resultsRef}
        tabIndex={-1}
        aria-label="Equivalencias de mi pauta"
        className={
          view === 'grid'
            ? 'grid scroll-mt-24 gap-3 outline-none sm:grid-cols-2'
            : 'scroll-mt-24 space-y-2 outline-none'
        }
      >
        {pageRules.map((rule) => (
          <li
            key={rule.id}
            className={`min-w-0 rounded-xl border border-slate-800 bg-slate-950/70 p-3 sm:p-4 ${
              view === 'grid' ? 'flex flex-col' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="break-words text-sm font-semibold leading-6 text-slate-100">
                  {rule.name}
                </h4>
                {rule.free ? (
                  <p className="mt-1 text-xs font-medium text-emerald-300">
                    Libre · sin sumar porciones
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">
                    Referencia:{' '}
                    <span className="font-medium text-slate-200">
                      {formatPortions(rule.referenceAmount)}{' '}
                      {rule.referenceAmount === 1
                        ? {
                            unit: 'unidad',
                            scoop: 'scoop',
                            cup: 'taza',
                            g: 'g',
                            ml: 'ml',
                          }[rule.unit]
                        : QUANTITY_LABELS[rule.unit]}
                    </span>
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  aria-label={`Editar equivalencia: ${rule.name}`}
                  title="Editar equivalencia"
                  onClick={() => onEdit(rule)}
                  className={`${action} border-emerald-400/20 bg-emerald-400/5 text-emerald-300 hover:border-emerald-400/60 hover:bg-emerald-400/15 focus-visible:outline-emerald-300`}
                >
                  <Pencil size={16} aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={`Quitar equivalencia: ${rule.name}`}
                  title="Quitar equivalencia"
                  onClick={() => onRemove(rule)}
                  className={`${action} border-rose-400/20 bg-rose-400/5 text-rose-300 hover:border-rose-400/60 hover:bg-rose-400/15 focus-visible:outline-rose-300`}
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              </div>
            </div>
            {!rule.free && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {rule.contributions.map((item) => (
                  <span
                    key={item.group}
                    className="rounded-lg border border-emerald-400/15 bg-emerald-400/5 px-2 py-1 text-xs text-emerald-200"
                  >
                    {formatPortions(item.portions)} {PAUTA_LABELS[item.group]}
                  </span>
                ))}
              </div>
            )}
            {rule.notes && (
              <details className="mt-3 border-t border-slate-800 pt-2 text-xs">
                <summary className="min-h-8 cursor-pointer py-1 text-slate-400 hover:text-slate-200">
                  Preparación y notas
                </summary>
                <p className="mt-1 whitespace-pre-line break-words leading-5 text-slate-300">
                  {rule.notes}
                </p>
              </details>
            )}
          </li>
        ))}
      </ul>
      {!pageRules.length && (
        <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
          <p className="text-sm text-slate-300">
            {rules.length
              ? 'No hay equivalencias con estos filtros.'
              : 'Todavía no tienes equivalencias.'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {rules.length
              ? 'Cambia el nombre, grupo o unidad para ampliar la búsqueda.'
              : 'Carga una plantilla o agrega tu primera equivalencia.'}
          </p>
        </div>
      )}
      {filtered.length > PAGE_SIZE && (
        <nav
          aria-label="Páginas de equivalencias"
          className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3"
        >
          <p className="text-xs text-slate-500">
            Orden alfabético · {PAGE_SIZE} por página
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Página anterior de equivalencias"
              title="Página anterior"
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
              className={`${action} border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-30`}
            >
              <ChevronLeft size={18} aria-hidden />
            </button>
            <label className="text-xs text-slate-400">
              <span className="sr-only">Página de equivalencias</span>
              <select
                value={currentPage}
                onChange={(e) => goToPage(Number(e.target.value))}
                className="min-h-11 rounded-xl border border-slate-700 bg-slate-950 px-2 text-xs text-slate-200"
              >
                {Array.from({ length: totalPages }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Página {i + 1} de {totalPages}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              aria-label="Página siguiente de equivalencias"
              title="Página siguiente"
              disabled={currentPage === totalPages}
              onClick={() => goToPage(currentPage + 1)}
              className={`${action} border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-30`}
            >
              <ChevronRight size={18} aria-hidden />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
