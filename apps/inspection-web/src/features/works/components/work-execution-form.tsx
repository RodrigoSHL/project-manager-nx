import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ClipboardCheck } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type {
  ConceptResponse,
  FinishResult,
  TaskCompletion,
  Work,
  WorkItemValue,
  WorkTemplateSnapshot,
} from '../models';

type WorkExecutionFormProps = {
  work: Work;
  snapshot: WorkTemplateSnapshot;
  responses: ConceptResponse[];
  taskCompletions: TaskCompletion[];
  onSave: (values: Record<string, WorkItemValue>) => Promise<void>;
  onStart: () => Promise<void>;
  onFinish: (values: Record<string, WorkItemValue>) => Promise<FinishResult>;
};

export function WorkExecutionForm({
  work,
  snapshot,
  responses,
  taskCompletions,
  onSave,
  onStart,
  onFinish,
}: WorkExecutionFormProps) {
  const [values, setValues] = useState<Record<string, WorkItemValue>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [finishError, setFinishError] = useState<FinishResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const initializedWorkId = useRef<string | null>(null);
  const readonly = work.status === 'FINISHED' || work.status === 'REVIEWED';

  useEffect(() => {
    if (initializedWorkId.current === work.id) return;
    initializedWorkId.current = work.id;
    setValues({
      ...Object.fromEntries(
        responses
          .filter((response) => response.workId === work.id)
          .map((response) => [
            response.formItemId,
            {
              valueNumber: response.valueNumber,
              valueText: response.valueText,
              selectedOptionId: response.selectedOptionId,
            },
          ])
      ),
      ...Object.fromEntries(
        taskCompletions
          .filter(
            (completion) =>
              completion.workId === work.id && completion.completed
          )
          .map((completion) => [completion.formItemId, { completed: true }])
      ),
    });
  }, [responses, taskCompletions, work.id]);

  function update(itemId: string, value: WorkItemValue) {
    setValues((current) => ({ ...current, [itemId]: value }));
    setNotice(null);
    setFinishError(null);
  }

  async function run(action: () => Promise<void>, success: string) {
    setIsSaving(true);
    setFinishError(null);
    try {
      await action();
      setNotice(success);
    } catch (error) {
      setNotice(null);
      setFinishError({
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'No fue posible guardar los cambios.',
        missingLabels: [],
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function finish() {
    setIsSaving(true);
    try {
      const result = await onFinish(values);
      if (result.ok) {
        setFinishError(null);
        setNotice('Trabajo finalizado correctamente.');
      } else {
        setFinishError(result);
        setNotice(null);
      }
    } catch (error) {
      setFinishError({
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : 'No fue posible finalizar el trabajo.',
        missingLabels: [],
      });
      setNotice(null);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
            <ClipboardCheck className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold text-slate-950">{snapshot.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Plantilla conservada · versión {snapshot.formTemplateVersion}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 p-4 sm:p-6">
        {snapshot.sections.map((section) => {
          const visibleItems = section.items.filter(
            (item) => item.type === 'TASK' || item.concept?.type !== 'HIDDEN'
          );
          return (
            <section key={section.id}>
              <div className="border-b border-slate-200 pb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Sección {section.order}
                </p>
                <h3 className="mt-1 font-semibold text-slate-950">
                  {section.title}
                </h3>
                {section.description ? (
                  <p className="mt-1 text-sm text-slate-500">
                    {section.description}
                  </p>
                ) : null}
              </div>
              <div className="mt-5 grid gap-6">
                {visibleItems.map((item) => {
                  if (item.type === 'TASK') {
                    return (
                      <label
                        key={item.id}
                        className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
                      >
                        <input
                          type="checkbox"
                          checked={values[item.id]?.completed ?? false}
                          disabled={readonly}
                          onChange={(event) =>
                            update(item.id, { completed: event.target.checked })
                          }
                          className="mt-0.5 size-5 shrink-0"
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {item.title ?? 'Actividad'}
                            {item.required ? ' *' : ''}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.description ??
                              'Confirma la ejecución de esta actividad.'}
                          </p>
                        </div>
                      </label>
                    );
                  }
                  const concept = item.concept;
                  if (!concept) return null;
                  const value = values[item.id] ?? {};
                  return (
                    <fieldset key={item.id} disabled={readonly}>
                      <legend className="text-sm font-semibold text-slate-800">
                        {concept.name}
                        {item.required ? ' *' : ''}
                      </legend>
                      {concept.description ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {concept.description}
                        </p>
                      ) : null}
                      {concept.type === 'ANALOG' ? (
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="number"
                            value={value.valueNumber ?? ''}
                            onChange={(event) =>
                              update(item.id, {
                                valueNumber:
                                  event.target.value === ''
                                    ? undefined
                                    : Number(event.target.value),
                              })
                            }
                            className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50"
                          />
                          {concept.unit ? (
                            <span className="shrink-0 text-sm font-medium text-slate-600">
                              {concept.unit}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                      {concept.type === 'DIGITAL' ? (
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {concept.options.map((option) => (
                            <label
                              key={option.id}
                              className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 has-[:checked]:border-slate-700 has-[:checked]:bg-slate-50"
                            >
                              <input
                                type="radio"
                                name={item.id}
                                checked={value.selectedOptionId === option.id}
                                onChange={() =>
                                  update(item.id, {
                                    selectedOptionId: option.id,
                                  })
                                }
                              />
                              {option.label}
                            </label>
                          ))}
                        </div>
                      ) : null}
                      {concept.type === 'TEXT' ? (
                        <textarea
                          rows={3}
                          value={value.valueText ?? ''}
                          onChange={(event) =>
                            update(item.id, { valueText: event.target.value })
                          }
                          className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50"
                        />
                      ) : null}
                    </fieldset>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="border-t border-slate-200 p-4 sm:p-6">
        {finishError && !finishError.ok ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="flex items-center gap-2 font-semibold">
              <AlertCircle className="size-4" /> No se puede finalizar.
            </p>
            <p className="mt-1">{finishError.message}</p>
            {finishError.missingLabels.length > 0 ? (
              <ul className="mt-2 list-disc pl-5">
                {finishError.missingLabels.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        {notice ? (
          <p className="mb-4 flex items-center gap-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="size-4" /> {notice}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {work.status === 'DRAFT' ? (
            <Button
              type="button"
              disabled={isSaving}
              onClick={() =>
                void run(onStart, 'Trabajo iniciado correctamente.')
              }
            >
              Iniciar trabajo
            </Button>
          ) : null}
          {!readonly ? (
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() =>
                void run(
                  () => onSave(values),
                  'Borrador guardado en la base de datos.'
                )
              }
            >
              {isSaving ? 'Guardando...' : 'Guardar borrador'}
            </Button>
          ) : null}
          {work.status === 'IN_PROGRESS' ? (
            <Button
              type="button"
              disabled={isSaving}
              onClick={() => void finish()}
            >
              Finalizar trabajo
            </Button>
          ) : null}
          {readonly ? (
            <p className="text-sm text-slate-500">
              El formulario está cerrado para edición.
            </p>
          ) : null}
        </div>
      </footer>
    </section>
  );
}
