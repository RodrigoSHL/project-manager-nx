import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Sparkles, BookOpen } from 'lucide-react';
import {
  EquivalenceSuggestionRequest,
  EquivalenceSuggestions,
  MealEntry,
  NutritionPlan,
  PAUTA_LABELS,
  QUANTITY_LABELS,
  calculatePauta,
  formatPortions,
} from '../types/nutrition';
import { SessionChangedError } from '../features/auth/auth-session';

export type SuggestEquivalences = (
  id: string,
  input: EquivalenceSuggestionRequest,
  signal: AbortSignal
) => Promise<EquivalenceSuggestions>;
export type SuggestedEquivalence =
  EquivalenceSuggestions['suggestions'][number];
const portionsText = (
  items: { group: keyof typeof PAUTA_LABELS; portions: number }[]
) =>
  items
    .map(
      (item) => `${formatPortions(item.portions)} ${PAUTA_LABELS[item.group]}`
    )
    .join(' + ');

export function EquivalenceSuggestionsPanel({
  entry,
  plan,
  basis,
  previewLabel = 'Tu consumo',
  onSuggest,
  onApply,
  disabled,
}: {
  entry: Pick<MealEntry, 'foodId' | 'foodName' | 'amountGrams' | 'quantity'>;
  plan: NutritionPlan;
  basis: EquivalenceSuggestions['basis'];
  previewLabel?: string;
  onSuggest: (
    useAi: boolean,
    signal: AbortSignal,
    mode?: 'compare' | 'estimate'
  ) => Promise<EquivalenceSuggestions>;
  onApply: (suggestion: SuggestedEquivalence) => void;
  disabled: boolean;
}) {
  const [result, setResult] = useState<EquivalenceSuggestions | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState('');
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  const deadline = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [applied, setApplied] = useState<string | null>(null);
  useEffect(
    () => () => {
      clearTimeout(deadline.current);
      request.current?.abort();
      request.current = null;
    },
    []
  );
  async function suggest(useAi: boolean, mode?: 'compare' | 'estimate') {
    if (request.current || disabled) return;
    const controller = new AbortController();
    request.current = controller;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 40000);
    deadline.current = timer;
    setLoading(true);
    setLoadingLabel(
      useAi
        ? mode === 'estimate'
          ? 'Preparando propuesta con IA…'
          : 'Comparando referencias con IA…'
        : 'Buscando referencias…'
    );
    setError('');
    // An earlier "no reference" result must not look like the outcome of the
    // new AI request when that request fails. Keep valid saved references usable.
    setResult((previous) =>
      previous?.status === 'insufficient' ? null : previous
    );
    try {
      const response = await onSuggest(useAi, controller.signal, mode);
      if (request.current !== controller || controller.signal.aborted) return;
      if (
        response.basis.mealId !== basis.mealId ||
        response.basis.productId !== basis.productId ||
        response.basis.dayPlanVersion !== basis.dayPlanVersion ||
        response.basis.catalogPlanVersion !== basis.catalogPlanVersion
      )
        throw new Error(
          'La respuesta corresponde a otra selección. Vuelve a solicitar la ayuda.'
        );
      setResult(response);
      setApplied(null);
      setExpanded(true);
    } catch (failure) {
      if (
        request.current !== controller ||
        (controller.signal.aborted && !timedOut) ||
        failure instanceof SessionChangedError
      )
        return;
      setError(
        failure instanceof Error &&
          !['AbortError', 'TimeoutError'].includes(failure.name)
          ? failure.message
          : 'La ayuda tardó demasiado. Puedes volver a intentarlo o completar la referencia manualmente.'
      );
    } finally {
      clearTimeout(timer);
      if (request.current === controller) {
        request.current = null;
        setLoading(false);
      }
    }
  }
  return (
    <section
      aria-label="Ayuda para elegir una equivalencia"
      className="mb-5 rounded-2xl border border-violet-400/30 bg-violet-400/5 p-4"
    >
      <h3 className="flex items-center gap-2 font-semibold text-violet-100">
        <Sparkles className="size-4" /> ¿Cómo cuenta este alimento?
      </h3>
      <div
        role="group"
        aria-label="Opciones de equivalencia"
        className="mt-3 flex flex-wrap gap-2"
      >
        <button
          type="button"
          onClick={() => suggest(false)}
          disabled={loading || disabled}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800/60 px-3 py-2.5 text-sm font-semibold text-slate-100 hover:border-violet-400/60 disabled:opacity-50"
        >
          <BookOpen className="size-4 shrink-0" /> Buscar en mi pauta
        </button>
        {(basis.productId || basis.mealId) && (
          <button
            type="button"
            disabled={loading || disabled}
            onClick={() => suggest(true, 'estimate')}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-violet-400/50 bg-violet-400/20 px-3 py-2.5 text-sm font-semibold text-violet-100 hover:bg-violet-400/30 disabled:opacity-50"
          >
            <Sparkles className="size-4 shrink-0" /> Proponer con IA
          </button>
        )}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-400">
        <strong className="font-medium text-slate-300">
          Buscar en mi pauta
        </strong>{' '}
        consulta referencias guardadas.{' '}
        <strong className="font-medium text-slate-300">Proponer con IA</strong>{' '}
        crea una estimación con{' '}
        {basis.productId
          ? 'la ficha del producto'
          : 'los datos registrados de esta comida'}
        . Puede consumir cuota de Gemini. Revisa antes de guardar.
      </p>
      {!basis.productId && (
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          No requiere un producto. Los nutrientes pueden ser estimados; agrega
          detalles de preparación si hace falta.
        </p>
      )}
      {loading && (
        <p
          role="status"
          className="mt-3 flex items-center gap-2 text-sm text-violet-200"
        >
          <LoaderCircle className="size-4 animate-spin" /> {loadingLabel}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-rose-300">
          {error}
        </p>
      )}
      {result && (
        <div className="mt-4 space-y-3">
          <p role="status" className="text-sm text-slate-300">
            {result.message}
          </p>
          {result.missingInfo.map((info, index) => (
            <p
              key={index}
              className="rounded-xl border border-amber-400/25 bg-amber-400/5 p-3 text-sm leading-relaxed text-amber-200"
            >
              {info}
            </p>
          ))}
          {result.suggestions.length > 0 && (
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
              className="text-sm font-semibold text-violet-200 underline underline-offset-4"
            >
              {expanded
                ? 'Ocultar referencias'
                : `Ver referencias (${result.suggestions.length})`}
            </button>
          )}
          {expanded &&
            result.suggestions.map((suggestion) => {
              const { rule } = suggestion;
              const preview = calculatePauta(
                { ...plan, rules: [rule] },
                entry,
                {
                  ruleId: rule.id,
                }
              );
              return (
                <article
                  key={suggestion.key}
                  className="rounded-xl border border-slate-700 bg-slate-950/60 p-3"
                >
                  <p className="flex items-center gap-2 text-xs text-slate-400">
                    <BookOpen className="size-3.5" />{' '}
                    {suggestion.origin === 'day'
                      ? 'Pauta de este día'
                      : suggestion.origin === 'catalog'
                      ? 'Equivalencia guardada en mi cuenta'
                      : 'Propuesta nueva · no incluida en tu pauta'}{' '}
                    ·{' '}
                    {suggestion.match === 'estimated'
                      ? suggestion.evidence?.method === 'reference'
                        ? 'Referencia general'
                        : 'Estimada con IA'
                      : suggestion.match === 'ai'
                      ? 'Comparada con IA'
                      : suggestion.match === 'exact'
                      ? 'Coincidencia guardada'
                      : 'Nombre relacionado'}
                  </p>
                  <h4 className="mt-2 font-semibold text-slate-100">
                    {rule.name}
                  </h4>
                  <p className="mt-1 text-xs text-slate-400">
                    {suggestion.origin === 'estimate'
                      ? 'Confianza orientativa'
                      : 'Coincidencia'}
                    :{' '}
                    {
                      { high: 'alta', medium: 'para revisar', low: 'dudosa' }[
                        suggestion.confidence
                      ]
                    }
                    . No confirma la equivalencia nutricional.
                  </p>
                  <p className="mt-1 text-sm text-emerald-200">
                    {formatPortions(rule.referenceAmount)}{' '}
                    {QUANTITY_LABELS[rule.unit]} de referencia →{' '}
                    {rule.free
                      ? suggestion.origin === 'estimate'
                        ? 'Condimento sin sumar intercambios'
                        : 'Libre según esta referencia'
                      : portionsText(rule.contributions)}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    {suggestion.explanation}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-200">
                    {suggestion.uncertainty}
                  </p>
                  {suggestion.evidence && (
                    <div className="mt-3 space-y-2 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-relaxed">
                      <p className="font-semibold text-amber-200">
                        Antes de aceptar, comprueba:
                      </p>
                      <ul className="list-disc space-y-1 pl-4 text-slate-300">
                        {suggestion.evidence.assumptions.map(
                          (assumption, index) => (
                            <li key={index}>{assumption}</li>
                          )
                        )}
                      </ul>
                      {suggestion.evidence.sources.length ? (
                        suggestion.evidence.sources.map((source) => (
                          <a
                            key={source.url}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-violet-200 underline underline-offset-2"
                          >
                            Fuente general: {source.title}
                          </a>
                        ))
                      ) : (
                        <p className="text-slate-400">
                          Estimación del modelo: sin consulta web ni fuente
                          externa verificada.
                        </p>
                      )}
                      <p className="text-slate-400">
                        No cambia tus metas, calorías ni macros. Al guardar se
                        incorpora como una equivalencia que tú aceptaste.
                      </p>
                    </div>
                  )}
                  {rule.notes && !suggestion.evidence && (
                    <p className="mt-2 text-xs text-slate-400">
                      Notas guardadas: {rule.notes}
                    </p>
                  )}
                  <p className="mt-3 rounded-lg bg-slate-800/70 p-2 text-sm text-slate-200">
                    {previewLabel}:{' '}
                    {preview.status === 'matched'
                      ? portionsText(preview.contributions)
                      : preview.status === 'free'
                      ? 'No suma porciones según esta referencia. Las calorías y macros se siguen contando.'
                      : 'Falta indicar la cantidad consumida en la unidad de esta referencia.'}
                  </p>
                  <button
                    type="button"
                    disabled={loading || disabled}
                    onClick={() => {
                      onApply(suggestion);
                      setApplied(suggestion.key);
                      setExpanded(false);
                    }}
                    className="mt-3 rounded-lg bg-emerald-400/15 px-3 py-2 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-400/40 hover:bg-emerald-400/25 disabled:opacity-50"
                  >
                    Aplicar al formulario: {rule.name}
                  </button>
                </article>
              );
            })}
          {applied && (
            <p role="status" className="text-sm text-emerald-200">
              Referencia aplicada al formulario. Revisa el aporte de abajo y
              confirma el guardado.
            </p>
          )}
          {result.suggestions.some(
            (suggestion) => suggestion.origin !== 'estimate'
          ) && (
            <div className="border-t border-violet-400/20 pt-3">
              <button
                type="button"
                disabled={loading || disabled}
                onClick={() => suggest(true, 'compare')}
                className="inline-flex items-center gap-2 rounded-xl border border-violet-400/40 px-3 py-2 text-sm font-semibold text-violet-200 hover:bg-violet-400/10 disabled:opacity-50"
              >
                <Sparkles className="size-4" /> Comparar con IA
              </button>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Gemini compara los nombres del alimento y estas referencias. No
                crea porciones nuevas. Esta acción usa una llamada de IA; puede
                no encontrar una opción adecuada.
              </p>
            </div>
          )}
        </div>
      )}
      {result?.status === 'insufficient' && (
        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          No se deduce que sea libre por tener pocas calorías. Puedes pedir una
          propuesta o dejarlo pendiente; sus nutrientes siguen registrados.
        </p>
      )}
    </section>
  );
}
