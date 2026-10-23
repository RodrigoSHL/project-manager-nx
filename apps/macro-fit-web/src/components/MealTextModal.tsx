import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  LoaderCircle,
  Mic,
  Sparkles,
  Square,
  X,
} from 'lucide-react';
import { useSpeechInput } from '../hooks/useSpeechInput';
import { MealType, PlateAnalysisResponse } from '../types/nutrition';
import { analyzeMealText } from '../utils/plateAnalysisApi';

interface MealTextModalProps {
  defaultMealType?: MealType;
  onClose: () => void;
  onAnalysisSuccess: (
    analysis: PlateAnalysisResponse,
    text: string,
    mealType: MealType
  ) => void;
}

export function MealTextModal({
  defaultMealType,
  onClose,
  onAnalysisSuccess,
}: MealTextModalProps) {
  const [text, setText] = useState('');
  const [mealType, setMealType] = useState<MealType | ''>(
    defaultMealType ?? ''
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prefix = useRef('');
  const pending = useRef<AbortController | null>(null);
  const speech = useSpeechInput((transcript) => {
    const next = [prefix.current, transcript].filter(Boolean).join(' ');
    setText(next.slice(0, 2000));
    if (next.length > 2000)
      setError(
        'Se alcanzó el límite de 2000 caracteres. Detén el dictado y revisa el texto.'
      );
  });
  const dictating = speech.phase !== 'idle';

  useEffect(() => () => pending.current?.abort(), []);

  const analyze = async () => {
    if (pending.current || dictating) return;
    const controller = new AbortController();
    pending.current = controller;
    setError(null);
    setIsAnalyzing(true);
    try {
      const result = await analyzeMealText(
        text,
        mealType || undefined,
        controller.signal
      );
      if (controller.signal.aborted) return;
      const target =
        mealType ||
        (result.meal_type && result.meal_type !== 'unspecified'
          ? result.meal_type
          : 'lunch');
      onAnalysisSuccess(result, text.trim(), target);
      onClose();
    } catch (err: unknown) {
      if (!controller.signal.aborted)
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudo analizar tu comida. Intenta nuevamente.'
        );
    } finally {
      pending.current = null;
      if (!controller.signal.aborted) setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="meal-text-title"
        className="w-full max-w-xl max-h-[95dvh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div>
            <h2 id="meal-text-title" className="text-sm font-bold text-white">
              Describe tu comida
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Escribe o dicta lo que comiste y revisa el texto antes de
              analizar.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar descripción"
            className="p-2 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label
              htmlFor="meal-description"
              className="block text-xs font-semibold text-slate-200 mb-2"
            >
              ¿Qué comiste?
            </label>
            <textarea
              id="meal-description"
              value={text}
              onChange={(event) => setText(event.target.value)}
              maxLength={2000}
              rows={6}
              autoFocus
              disabled={dictating || isAnalyzing}
              placeholder="En el almuerzo comí 200 g de carne, 50 g de arroz, harta ensalada, 40 g de palta y 9 g de mayo Kraft."
              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-80"
            />
            <div className="flex justify-between gap-3 text-[11px] text-slate-400 mt-1">
              <span>
                Indica gramos y si pesaste crudo o cocido cuando lo sepas.
              </span>
              <span>{text.length}/2000</span>
            </div>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3 space-y-2">
            {speech.supported ? (
              <button
                type="button"
                disabled={
                  isAnalyzing ||
                  speech.phase === 'starting' ||
                  speech.phase === 'stopping'
                }
                onClick={() => {
                  if (dictating) speech.stop();
                  else {
                    prefix.current = text.trim();
                    speech.start();
                  }
                }}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-slate-800 text-sm font-semibold text-emerald-300 disabled:opacity-50"
              >
                {dictating ? (
                  <Square className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
                {speech.phase === 'starting'
                  ? 'Iniciando micrófono…'
                  : speech.phase === 'stopping'
                  ? 'Terminando dictado…'
                  : dictating
                  ? 'Detener dictado'
                  : 'Dictar comida'}
              </button>
            ) : (
              <p className="text-xs text-slate-300">
                Este navegador no ofrece dictado integrado. Puedes escribir o
                usar el micrófono del teclado de tu teléfono.
              </p>
            )}
            <p className="text-[11px] text-slate-400">
              El dictado depende del navegador y puede enviar audio a su
              servicio de reconocimiento. MacroFit envía a Gemini solo el texto
              que confirmas al analizar.
            </p>
            <p
              role="status"
              aria-live="polite"
              className="text-xs text-emerald-300"
            >
              {speech.phase === 'listening'
                ? 'Escuchando en español…'
                : speech.phase === 'stopping'
                ? 'Esperando las últimas palabras…'
                : ''}
            </p>
            {speech.error && (
              <p role="alert" className="text-xs text-amber-300">
                {speech.error}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="text-meal-type"
              className="block text-xs font-semibold text-slate-200 mb-2"
            >
              Tiempo de comida
            </label>
            <select
              id="text-meal-type"
              value={mealType}
              onChange={(event) =>
                setMealType(event.target.value as MealType | '')
              }
              disabled={isAnalyzing}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white"
            >
              <option value="">
                Detectar del texto (si no se indica: almuerzo)
              </option>
              <option value="breakfast">Desayuno</option>
              <option value="colacion_am">Colación mañana</option>
              <option value="lunch">Almuerzo</option>
              <option value="colacion_pm">Colación tarde</option>
              <option value="dinner">Cena</option>
              <option value="snacks">Snacks</option>
            </select>
          </div>
          <p className="text-xs text-slate-400">
            Si dices “harta ensalada” o “una cucharada”, estimaremos su peso y
            lo marcaremos para que puedas ajustarlo. No se registra nada hasta
            que confirmes el desglose.
          </p>
          {error && (
            <div
              role="alert"
              className="flex gap-2 rounded-xl border border-rose-500/30 bg-rose-950/50 p-3 text-xs text-rose-300"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={analyze}
            disabled={isAnalyzing || dictating || text.trim().length < 5}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <LoaderCircle className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isAnalyzing ? 'Analizando descripción…' : 'Analizar descripción'}
          </button>
        </div>
      </section>
    </div>
  );
}
