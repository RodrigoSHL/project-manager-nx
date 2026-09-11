import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ClipboardCheck } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type {
  ConceptResponse,
  FinishResult,
  TaskCompletion,
  Work,
  WorkItemAnnotation,
  WorkItemValue,
  WorkTemplateSnapshot,
} from '../models';
import {
  deleteWorkPhoto,
  listWorkPhotos,
  loadWorkPhotoUrl,
  uploadWorkPhoto,
} from '../work-photo-api';
import {
  WorkItemAdditionalInfo,
  type WorkItemPhotoPreview,
} from './work-item-additional-info';

type WorkExecutionFormProps = {
  work: Work;
  snapshot: WorkTemplateSnapshot;
  responses: ConceptResponse[];
  taskCompletions: TaskCompletion[];
  annotations: WorkItemAnnotation[];
  onSave: (values: Record<string, WorkItemValue>) => Promise<void>;
  onStart: () => Promise<void>;
  onFinish: (values: Record<string, WorkItemValue>) => Promise<FinishResult>;
};

export function WorkExecutionForm({
  work,
  snapshot,
  responses,
  taskCompletions,
  annotations,
  onSave,
  onStart,
  onFinish,
}: WorkExecutionFormProps) {
  const [values, setValues] = useState<Record<string, WorkItemValue>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [finishError, setFinishError] = useState<FinishResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [photos, setPhotos] = useState<WorkItemPhotoPreview[]>([]);
  const [photoBusyItems, setPhotoBusyItems] = useState<string[]>([]);
  const [photoErrors, setPhotoErrors] = useState<Record<string, string>>({});
  const initializedWorkId = useRef<string | null>(null);
  const previewUrls = useRef(new Set<string>());
  const readonly = work.status === 'FINISHED' || work.status === 'REVIEWED';

  useEffect(() => {
    if (initializedWorkId.current === work.id) return;
    initializedWorkId.current = work.id;
    const next: Record<string, WorkItemValue> = {};
    for (const response of responses.filter(
      (item) => item.workId === work.id
    )) {
      next[response.formItemId] = {
        ...next[response.formItemId],
        valueNumber: response.valueNumber,
        valueText: response.valueText,
        selectedOptionId: response.selectedOptionId,
      };
    }
    for (const completion of taskCompletions.filter(
      (item) => item.workId === work.id
    )) {
      next[completion.formItemId] = {
        ...next[completion.formItemId],
        completed: completion.completed,
      };
    }
    for (const annotation of annotations.filter(
      (item) => item.workId === work.id
    )) {
      next[annotation.formItemId] = {
        ...next[annotation.formItemId],
        comment: annotation.comment,
      };
    }
    setValues(next);
  }, [annotations, responses, taskCompletions, work.id]);

  useEffect(() => {
    let cancelled = false;
    const workPreviewUrls = new Set<string>();
    previewUrls.current = workPreviewUrls;
    async function loadPhotos() {
      try {
        const records = await listWorkPhotos(work.tenantId, work.id);
        const loaded = await Promise.allSettled(
          records.map(async (photo) => ({
            ...photo,
            previewUrl: await loadWorkPhotoUrl(photo.id),
          }))
        );
        if (cancelled) {
          loaded.forEach((result) => {
            if (result.status === 'fulfilled') {
              URL.revokeObjectURL(result.value.previewUrl);
            }
          });
          return;
        }
        const available = loaded.flatMap((result) =>
          result.status === 'fulfilled' ? [result.value] : []
        );
        available.forEach((photo) => workPreviewUrls.add(photo.previewUrl));
        setPhotos(available);
        if (available.length !== records.length) {
          setPhotoErrors((current) => ({
            ...current,
            general: 'Algunas fotografías no se pudieron cargar.',
          }));
        }
      } catch (error) {
        if (!cancelled) {
          setPhotoErrors((current) => ({
            ...current,
            general: messageFrom(error),
          }));
        }
      }
    }
    void loadPhotos();
    return () => {
      cancelled = true;
      workPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      workPreviewUrls.clear();
    };
  }, [work.id, work.tenantId]);

  function update(itemId: string, value: WorkItemValue) {
    setValues((current) => ({
      ...current,
      [itemId]: { ...current[itemId], ...value },
    }));
    setNotice(null);
    setFinishError(null);
  }

  async function uploadPhotos(itemId: string, files: File[]) {
    setPhotoBusyItems((current) => [...new Set([...current, itemId])]);
    setPhotoErrors((current) => ({ ...current, [itemId]: '' }));
    try {
      for (const file of files) {
        const photo = await uploadWorkPhoto(
          work.tenantId,
          work.id,
          itemId,
          file
        );
        const previewUrl = await loadWorkPhotoUrl(photo.id);
        previewUrls.current.add(previewUrl);
        setPhotos((current) => [...current, { ...photo, previewUrl }]);
      }
    } catch (error) {
      setPhotoErrors((current) => ({
        ...current,
        [itemId]: messageFrom(error),
      }));
    } finally {
      setPhotoBusyItems((current) => current.filter((id) => id !== itemId));
    }
  }

  async function removePhoto(photo: WorkItemPhotoPreview) {
    const itemId = photo.metadata.formItemId;
    setPhotoBusyItems((current) => [...new Set([...current, itemId])]);
    setPhotoErrors((current) => ({ ...current, [itemId]: '' }));
    try {
      await deleteWorkPhoto(photo.id);
      URL.revokeObjectURL(photo.previewUrl);
      previewUrls.current.delete(photo.previewUrl);
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
    } catch (error) {
      setPhotoErrors((current) => ({
        ...current,
        [itemId]: messageFrom(error),
      }));
    } finally {
      setPhotoBusyItems((current) => current.filter((id) => id !== itemId));
    }
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
        {photoErrors.general ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {photoErrors.general}
          </p>
        ) : null}
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
                      <div
                        key={item.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      >
                        <label className="flex gap-3">
                          <input
                            type="checkbox"
                            checked={values[item.id]?.completed ?? false}
                            disabled={readonly}
                            onChange={(event) =>
                              update(item.id, {
                                completed: event.target.checked,
                              })
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
                        <WorkItemAdditionalInfo
                          itemId={item.id}
                          comment={values[item.id]?.comment ?? ''}
                          photos={photos.filter(
                            (photo) => photo.metadata.formItemId === item.id
                          )}
                          readonly={readonly}
                          busy={photoBusyItems.includes(item.id)}
                          error={photoErrors[item.id]}
                          onCommentChange={(comment) =>
                            update(item.id, { comment })
                          }
                          onUpload={uploadPhotos}
                          onDelete={removePhoto}
                        />
                      </div>
                    );
                  }
                  const concept = item.concept;
                  if (!concept) return null;
                  const value = values[item.id] ?? {};
                  return (
                    <fieldset
                      key={item.id}
                      className="min-w-0 rounded-lg border border-slate-200 p-4"
                    >
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
                            disabled={readonly}
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
                                disabled={readonly}
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
                          disabled={readonly}
                          value={value.valueText ?? ''}
                          onChange={(event) =>
                            update(item.id, { valueText: event.target.value })
                          }
                          className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50"
                        />
                      ) : null}
                      <WorkItemAdditionalInfo
                        itemId={item.id}
                        comment={value.comment ?? ''}
                        photos={photos.filter(
                          (photo) => photo.metadata.formItemId === item.id
                        )}
                        readonly={readonly}
                        busy={photoBusyItems.includes(item.id)}
                        error={photoErrors[item.id]}
                        onCommentChange={(comment) =>
                          update(item.id, { comment })
                        }
                        onUpload={uploadPhotos}
                        onDelete={removePhoto}
                      />
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

function messageFrom(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'No fue posible completar la operación.';
}
