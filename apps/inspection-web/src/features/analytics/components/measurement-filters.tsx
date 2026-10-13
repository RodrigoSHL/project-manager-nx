import type { ComponentProps } from 'react';
import { DashboardFilters } from './dashboard-filters';
import type { AnalyticsConcept } from '../models';

type Props = ComponentProps<typeof DashboardFilters> & {
  concepts: AnalyticsConcept[];
  conceptId: string;
  loadingConcepts: boolean;
  onConceptChange: (id: string) => void;
};

export function MeasurementFilters(props: Props) {
  const { concepts, conceptId, loadingConcepts, onConceptChange } = props;
  return (
    <>
      <DashboardFilters {...props} label="Filtros de mediciones" />
      <section
        className="mt-4 min-w-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm md:p-5"
        aria-label="Medición a comparar"
      >
        <label className="block min-w-0 text-sm font-medium text-slate-700 dark:text-slate-200">
          Medición a comparar
          <select
            className="mt-1.5 min-h-11 w-full min-w-0 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-base text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-800 disabled:bg-slate-50 dark:disabled:bg-slate-950 md:text-sm"
            value={
              concepts.some((item) => item.id === conceptId) ? conceptId : ''
            }
            onChange={(event) => onConceptChange(event.target.value)}
            disabled={loadingConcepts}
            required
          >
            <option value="">Selecciona una medición</option>
            {concepts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.unit ? ` (${item.unit})` : ''} · {item.measurementCount}{' '}
                mediciones
              </option>
            ))}
          </select>
        </label>
      </section>
    </>
  );
}
