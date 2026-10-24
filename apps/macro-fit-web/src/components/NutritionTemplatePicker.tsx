import { useState } from 'react';
import { BookOpen, Check, ChevronDown, ChevronUp, Search } from 'lucide-react';
import {
  getNutritionPlanTemplates,
  importNutritionPlanTemplate,
  NutritionPlanInput,
  nutritionPlanInputSchema,
  PAUTA_LABELS,
  QUANTITY_LABELS,
  formatPortions,
} from '../types/nutrition';

const templates = getNutritionPlanTemplates();
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export function NutritionTemplatePicker({
  draft,
  disabled,
  onApply,
}: {
  draft: NutritionPlanInput;
  disabled: boolean;
  onApply: (plan: NutritionPlanInput, message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(templates[0].id);
  const [query, setQuery] = useState('');
  const [section, setSection] = useState('');
  const [replace, setReplace] = useState(false);
  const [includeTargets, setIncludeTargets] = useState(!draft.rules.length);
  const [message, setMessage] = useState('');
  const selected =
    templates.find((item) => item.id === selectedId) ?? templates[0];
  const sections = [...new Set(selected.entries.map((entry) => entry.section))];
  const filtered = selected.entries.filter(
    (entry) =>
      (!section || entry.section === section) &&
      normalize(
        [
          entry.section,
          entry.rule.name,
          ...entry.rule.aliases,
          entry.householdMeasure,
          entry.rule.notes,
        ].join(' ')
      ).includes(normalize(query))
  );
  const existingIds = new Set(draft.rules.map((rule) => rule.id));
  const added = selected.entries.filter(
    (entry) => !existingIds.has(entry.rule.id)
  ).length;
  const baseIds = new Set([
    ...selected.entries.map((entry) => entry.rule.id),
    ...selected.legacyRuleIds,
  ]);
  const updated = draft.rules.filter((rule) => baseIds.has(rule.id)).length;
  const kept = draft.rules.length - updated;
  const apply = () => {
    const result = importNutritionPlanTemplate(draft, selected, {
      rules: replace ? 'replace' : 'merge',
      includeTargets,
    });
    const parsed = nutritionPlanInputSchema.safeParse(result);
    if (!parsed.success) {
      setMessage(
        'La combinación supera el límite de 250 equivalencias o contiene datos inválidos. Revisa tus reglas antes de importar.'
      );
      return;
    }
    onApply(
      parsed.data,
      replace
        ? `Plantilla v${selected.version} cargada: ${selected.entries.length} equivalencias. Revisa y guarda la pauta para aplicarla.`
        : `Plantilla v${selected.version} cargada: ${added} equivalencias nuevas, ${updated} referencias de la base actualizadas y ${kept} reglas propias conservadas. Revisa y guarda la pauta para aplicarla.`
    );
    setOpen(false);
    setMessage('');
  };
  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-slate-900 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 shrink-0 text-emerald-300" aria-hidden />
          <div>
            <h3 className="font-semibold">Plantillas de pautas</h3>
            <p className="mt-1 text-xs text-slate-400">
              Parte de una base completa y adáptala a tu cuenta.
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-200"
        >
          {open ? 'Ocultar plantillas' : 'Explorar plantillas'}
          {open ? (
            <ChevronUp size={16} aria-hidden />
          ) : (
            <ChevronDown size={16} aria-hidden />
          )}
        </button>
      </div>
      {open && (
        <div className="mt-5 space-y-4">
          <label className="block text-xs text-slate-300">
            Plantilla disponible
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setSection('');
              }}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm"
            >
              {templates.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · v{item.version}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-slate-300">{selected.description}</p>
          <p className="text-xs text-emerald-300">
            {selected.entries.length} equivalencias · {sections.length}{' '}
            categorías · versión {selected.version}
          </p>
          <details className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-100">
            <summary className="cursor-pointer font-semibold">
              Criterios y puntos por revisar de la fuente
            </summary>
            <ul className="mt-3 list-disc space-y-2 pl-4">
              {selected.reviewNotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </details>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-slate-300">
              Buscar en la plantilla
              <span className="mt-1 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3">
                <Search size={16} aria-hidden />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Alimento, preparación o medida…"
                  className="min-w-0 w-full bg-transparent py-3 text-sm outline-none"
                />
              </span>
            </label>
            <label className="text-xs text-slate-300">
              Categoría
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm"
              >
                <option value="">Todas las categorías</option>
                {sections.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-xs text-slate-400">
            {filtered.length} equivalencias encontradas. Los alimentos de una
            misma fila comparten referencia.
          </p>
          <div
            tabIndex={0}
            aria-label="Vista previa de equivalencias de la plantilla"
            className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-slate-800 p-2"
          >
            {filtered.map(({ rule, section: category, householdMeasure }) => (
              <article key={rule.id} className="rounded-lg bg-slate-950/70 p-3">
                <p className="text-[11px] text-slate-500">{category}</p>
                <h4 className="mt-1 text-sm font-semibold">{rule.name}</h4>
                <p className="mt-1 text-sm text-emerald-300">
                  {rule.free
                    ? 'Libre · sin sumar porciones'
                    : `${rule.referenceAmount} ${
                        rule.unit === 'cup' && rule.referenceAmount === 1
                          ? 'taza'
                          : QUANTITY_LABELS[rule.unit]
                      } → ${rule.contributions
                        .map(
                          (item) =>
                            `${formatPortions(item.portions)} ${
                              PAUTA_LABELS[item.group]
                            }`
                        )
                        .join(' + ')}`}
                </p>
                {householdMeasure && (
                  <p className="mt-1 text-xs text-slate-300">
                    Medida casera: {householdMeasure}
                  </p>
                )}
                {rule.notes && (
                  <p className="mt-1 text-xs text-slate-400">
                    {rule.notes
                      .replace(
                        `Medida casera de referencia: ${householdMeasure}.`,
                        ''
                      )
                      .trim()}
                  </p>
                )}
              </article>
            ))}
            {!filtered.length && (
              <p className="p-3 text-sm text-slate-400">
                No hay coincidencias. Prueba otro nombre o categoría.
              </p>
            )}
          </div>
          <div className="space-y-3 rounded-xl border border-slate-700 p-3 text-sm">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={includeTargets}
                onChange={(e) => setIncludeTargets(e.target.checked)}
              />
              <span>
                Usar también las metas de esta plantilla
                <span className="mt-1 block text-xs text-slate-400">
                  10 proteínas · 4 carbohidratos · 2 grasas · 3 lácteos · 3
                  frutas · verduras libres · 0 suplementos · agua &gt; 2000 ml.
                  Son editables y corresponden a la pauta de referencia.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={replace}
                onChange={(e) => setReplace(e.target.checked)}
              />
              <span>
                Reemplazar todas mis equivalencias por la plantilla
                <span className="mt-1 block text-xs text-slate-400">
                  {replace
                    ? `Se quitarán las ${draft.rules.length} reglas del borrador, incluidas las de tus productos. Tus productos y consumos no se eliminan.`
                    : `Se añadirán ${added} equivalencias y se actualizarán ${updated} referencias de esta base, incluyendo cantidades y nombres. Se conservarán las ${kept} reglas propias adicionales, incluidas las de tus productos.`}
                </span>
              </span>
            </label>
          </div>
          <p className="text-xs text-slate-400">
            La carga modifica este borrador. Se guarda como una copia personal
            al pulsar «Guardar pauta en mi cuenta». Conserva el nombre y la
            fecha que elegiste.
          </p>
          {disabled && (
            <p className="text-xs text-amber-300">
              Guarda o cancela la equivalencia en edición antes de cargar una
              plantilla.
            </p>
          )}
          {message && (
            <p role="alert" className="text-sm text-rose-300">
              {message}
            </p>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={apply}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-40 sm:w-auto"
          >
            <Check size={18} aria-hidden />
            Cargar plantilla en el borrador
          </button>
        </div>
      )}
    </div>
  );
}
