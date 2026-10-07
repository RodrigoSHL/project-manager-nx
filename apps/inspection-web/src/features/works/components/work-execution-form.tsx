import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type {
  ConceptResponse,
  FinishResult,
  TaskCompletion,
  Work,
  WorkFormItemSnapshot,
  WorkFormSectionSnapshot,
  WorkItemAnnotation,
  WorkItemValue,
  WorkTemplateSnapshot,
  FindingCandidate,
} from '../models';
import type { SeverityLevel } from '../../concepts/models';
import { deriveFindingCandidates } from '../finding-candidates';
import {
  deleteWorkPhoto,
  listWorkPhotos,
  loadWorkPhotoUrl,
  PhotoNetworkError,
  uploadWorkPhoto,
} from '../work-photo-api';
import {
  WorkItemAdditionalInfo,
  type WorkItemPhotoPreview,
} from './work-item-additional-info';
import { useOffline } from '../../offline/offline-context';
import {
  localPhotoAsWorkPhoto,
  localPhotoRepository,
} from '../../../repositories/local-photo-repository';

type WorkExecutionFormProps = {
  work: Work;
  snapshot: WorkTemplateSnapshot;
  responses: ConceptResponse[];
  taskCompletions: TaskCompletion[];
  annotations: WorkItemAnnotation[];
  findingCandidates?: FindingCandidate[];
  severityLevels?: SeverityLevel[];
  accessReadonly?: boolean;
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
  findingCandidates = [],
  severityLevels = [],
  accessReadonly = false,
  onSave,
  onStart,
  onFinish,
}: WorkExecutionFormProps) {
  const { mode, refresh: refreshOfflineState } = useOffline();
  const localMode = mode === 'LOCAL';
  const [values, setValues] = useState<Record<string, WorkItemValue>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [finishError, setFinishError] = useState<FinishResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [photos, setPhotos] = useState<WorkItemPhotoPreview[]>([]);
  const [photoBusyItems, setPhotoBusyItems] = useState<string[]>([]);
  const [photoErrors, setPhotoErrors] = useState<Record<string, string>>({});
  const initializedWorkId = useRef<string | null>(null);
  const previewUrls = useRef(new Set<string>());
  const readonly =
    accessReadonly || work.status === 'FINISHED' || work.status === 'REVIEWED';
  const formSections = groupSnapshotBySection(snapshot, work.assetId);
  const candidates = deriveFindingCandidates(
    work,
    snapshot,
    values,
    findingCandidates.filter((item) => item.workId === work.id)
  );
  const candidateItems = new Set(candidates.map((item) => item.workItemId));

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
        measuredAt: response.measuredAt,
        measuredAtTime: response.measuredAtTime?.slice(0, 5) ?? null,
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
        isFinding: annotation.isFinding ?? false,
      };
    }
    setValues(next);
  }, [annotations, responses, taskCompletions, work.id]);

  useEffect(() => {
    let cancelled = false;
    const workPreviewUrls = new Set<string>();
    previewUrls.current = workPreviewUrls;
    setPhotos([]);
    async function loadPhotos() {
      try {
        const references = await localPhotoRepository.list(
          work.tenantId,
          work.id
        );
        let remote: Awaited<ReturnType<typeof listWorkPhotos>> = [];
        let remoteError = false;
        if (!localMode) {
          try {
            remote = await listWorkPhotos(work.tenantId, work.id);
          } catch {
            remoteError = true;
          }
        }
        const locallyLoaded = await Promise.allSettled(
          references.map(async (reference) => {
            const stored = await localPhotoRepository.blob(reference.id);
            if (!stored) return null;
            const alreadyUploaded = remote.find(
              (photo) => photo.metadata.clientPhotoId === reference.id
            );
            if (alreadyUploaded && reference.status !== 'REMOTE_ONLY') {
              await localPhotoRepository.markUploaded(
                reference.id,
                alreadyUploaded.id
              );
            }
            const currentReference = alreadyUploaded
              ? {
                  ...reference,
                  remoteFileId: alreadyUploaded.id,
                  status: 'REMOTE_ONLY' as const,
                }
              : reference;
            return {
              ...localPhotoAsWorkPhoto(currentReference),
              previewUrl: URL.createObjectURL(stored.blob),
              localId: reference.id,
              canDelete:
                currentReference.status === 'PENDING_UPLOAD'
                  ? false
                  : currentReference.status !== 'REMOTE_ONLY' || !localMode,
              pendingUpload: currentReference.status !== 'REMOTE_ONLY',
            } satisfies WorkItemPhotoPreview;
          })
        );
        const allLocalPhotos = locallyLoaded.flatMap((result) =>
          result.status === 'fulfilled' && result.value ? [result.value] : []
        );
        const localPhotos = allLocalPhotos.filter((photo, index) => {
          const first = allLocalPhotos.findIndex(
            (candidate) => candidate.id === photo.id
          );
          if (first === index) return true;
          URL.revokeObjectURL(photo.previewUrl);
          return false;
        });
        const loadedIds = new Set(localPhotos.map((photo) => photo.id));
        const remotelyLoaded = await Promise.allSettled(
          remote
            .filter((photo) => !loadedIds.has(photo.id))
            .map(async (photo) => ({
              ...photo,
              previewUrl: await loadWorkPhotoUrl(photo.id),
              canDelete: true,
            }))
        );
        const loaded = [
          ...localPhotos,
          ...remotelyLoaded.flatMap((result) =>
            result.status === 'fulfilled' ? [result.value] : []
          ),
        ];
        if (cancelled) {
          loaded.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
          return;
        }
        const available = loaded;
        available.forEach((photo) => workPreviewUrls.add(photo.previewUrl));
        setPhotos((current) => {
          const availableIds = new Set(available.map((photo) => photo.id));
          return [
            ...available,
            ...current.filter(
              (photo) =>
                photo.ownerId === work.id &&
                workPreviewUrls.has(photo.previewUrl) &&
                !availableIds.has(photo.id)
            ),
          ];
        });
        if (
          remoteError ||
          [...locallyLoaded, ...remotelyLoaded].some(
            (result) => result.status === 'rejected'
          ) ||
          (localMode && references.length !== localPhotos.length)
        ) {
          setPhotoErrors((current) => ({
            ...current,
            general:
              'Algunas fotografías no están disponibles en este dispositivo.',
          }));
        } else {
          setPhotoErrors((current) => ({ ...current, general: '' }));
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
  }, [localMode, work.id, work.tenantId]);

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
        const identity = {
          id: crypto.randomUUID(),
          capturedAt: new Date().toISOString(),
        };
        async function saveLocally() {
          const reference = await localPhotoRepository.save(
            work.tenantId,
            work.id,
            itemId,
            file,
            identity
          );
          const previewUrl = URL.createObjectURL(file);
          previewUrls.current.add(previewUrl);
          setPhotos((current) => [
            ...current,
            {
              ...localPhotoAsWorkPhoto(reference),
              previewUrl,
              localId: reference.id,
              canDelete: true,
              pendingUpload: true,
            },
          ]);
          await refreshOfflineState().catch(() => undefined);
        }
        if (localMode) {
          await saveLocally();
          continue;
        }
        let photo;
        try {
          photo = await uploadWorkPhoto(work.tenantId, work.id, itemId, file, {
            clientPhotoId: identity.id,
            capturedAt: identity.capturedAt,
          });
        } catch (error) {
          if (!(error instanceof PhotoNetworkError)) throw error;
          await saveLocally();
          continue;
        }
        const previewUrl = URL.createObjectURL(file);
        previewUrls.current.add(previewUrl);
        setPhotos((current) => [
          ...current,
          { ...photo, previewUrl, canDelete: true },
        ]);
        try {
          await localPhotoRepository.cacheRemote(photo, file);
        } catch {
          setPhotoErrors((current) => ({
            ...current,
            [itemId]:
              'La foto se subió, pero no quedó disponible sin conexión en este dispositivo.',
          }));
        }
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
      const localReference = photo.localId
        ? (await localPhotoRepository.list(work.tenantId, work.id)).find(
            (item) => item.id === photo.localId
          )
        : undefined;
      if (localReference && localReference.status !== 'REMOTE_ONLY') {
        await localPhotoRepository.removeLocal(
          work.tenantId,
          work.id,
          localReference.id
        );
        await refreshOfflineState();
      } else if (localMode) {
        throw new Error(
          'La foto sincronizada solo se puede eliminar con conexión.'
        );
      } else {
        await deleteWorkPhoto(photo.id);
        await localPhotoRepository.removeRemoteCopy(
          work.tenantId,
          work.id,
          photo.id
        );
      }
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
        setNotice(
          localMode
            ? 'Trabajo finalizado y guardado localmente.'
            : 'Trabajo finalizado correctamente.'
        );
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

  function renderItem(item: WorkFormItemSnapshot) {
    const itemCandidates = candidates.filter(
      (candidate) => candidate.workItemId === item.id
    );
    if (item.type === 'TASK') {
      return (
        <div
          key={item.id}
          className={`rounded-lg border p-4 ${
            itemCandidates.length
              ? 'border-amber-300 bg-amber-50/40'
              : 'border-slate-200 bg-slate-50'
          }`}
        >
          <label className="flex gap-3">
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
                {item.description ?? 'Confirma la ejecución de esta actividad.'}
              </p>
            </div>
          </label>
          {itemCandidates.length ? (
            <p className="mt-2 text-xs font-medium text-amber-800">
              Observación marcada como posible hallazgo
            </p>
          ) : null}
          <WorkItemAdditionalInfo
            itemId={item.id}
            comment={values[item.id]?.comment ?? ''}
            isFinding={values[item.id]?.isFinding ?? false}
            onFindingChange={(isFinding) => update(item.id, { isFinding })}
            photos={photos.filter(
              (photo) => photo.metadata.formItemId === item.id
            )}
            readonly={readonly}
            busy={photoBusyItems.includes(item.id)}
            error={photoErrors[item.id]}
            onCommentChange={(comment) => update(item.id, { comment })}
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
        className={`min-w-0 rounded-lg border p-4 ${
          candidateItems.has(item.id)
            ? 'border-amber-300 bg-amber-50/30'
            : 'border-slate-200'
        }`}
      >
        <legend className="text-sm font-semibold text-slate-800">
          {concept.name}
          {item.required ? ' *' : ''}
        </legend>
        {candidateItems.has(item.id) ? (
          <p className="mb-2 text-xs font-medium text-amber-800">
            {itemCandidates.some((candidate) => candidate.source === 'ANALOG')
              ? '⚠ Valor fuera de rango'
              : itemCandidates.some(
                  (candidate) => candidate.source === 'DIGITAL'
                )
              ? '⚠ Esta respuesta genera un posible hallazgo'
              : '✓ Observación marcada como hallazgo'}
            {itemCandidates
              .map((candidate) => {
                const severity = severityLevels.find(
                  (level) => level.id === candidate.suggestedSeverityId
                );
                return severity
                  ? ` · Criticidad sugerida: ${severity.name}`
                  : '';
              })
              .join('')}
          </p>
        ) : null}
        {concept.description ? (
          <p className="mt-1 text-xs text-slate-500">{concept.description}</p>
        ) : null}
        {concept.type === 'ANALOG' ? (
          <div className="mt-2 flex flex-wrap items-end gap-2">
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
            <label className="flex min-w-40 flex-col text-xs font-medium text-slate-600">
              Fecha de medición
              <input
                type="date"
                disabled={readonly}
                value={
                  value.measuredAt?.slice(0, 10) ??
                  work.executionDate.slice(0, 10)
                }
                onChange={(event) =>
                  update(item.id, {
                    measuredAt: event.target.value || undefined,
                  })
                }
                className="mt-1 h-11 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 disabled:bg-slate-50"
              />
            </label>
            <label className="flex min-w-32 flex-col text-xs font-medium text-slate-600">
              Hora de medición (opcional)
              <input
                type="time"
                disabled={readonly}
                value={value.measuredAtTime?.slice(0, 5) ?? ''}
                onChange={(event) =>
                  update(item.id, {
                    measuredAtTime: event.target.value || null,
                  })
                }
                className="mt-1 h-11 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900 disabled:bg-slate-50"
              />
            </label>
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
                    update(item.id, { selectedOptionId: option.id })
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
          isFinding={value.isFinding ?? false}
          onFindingChange={(isFinding) => update(item.id, { isFinding })}
          photos={photos.filter(
            (photo) => photo.metadata.formItemId === item.id
          )}
          readonly={readonly}
          busy={photoBusyItems.includes(item.id)}
          error={photoErrors[item.id]}
          onCommentChange={(comment) => update(item.id, { comment })}
          onUpload={uploadPhotos}
          onDelete={removePhoto}
        />
      </fieldset>
    );
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
        {formSections.map((section) => (
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
              {section.assetGroups.map((group) =>
                group.assetDepth === 0 ? (
                  <div key={group.assetId} className="grid gap-6">
                    {group.items.map(renderItem)}
                  </div>
                ) : (
                  <details
                    key={group.assetId}
                    className="group rounded-xl border border-slate-200 bg-slate-50/60"
                  >
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-4 marker:content-none sm:px-5">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Activo descendiente · nivel {group.assetDepth}
                        </p>
                        <h4 className="mt-1 truncate font-semibold text-slate-950">
                          {group.assetName}
                        </h4>
                        {group.assetCode ? (
                          <p className="mt-1 text-xs font-medium text-slate-500">
                            {group.assetCode}
                          </p>
                        ) : null}
                      </div>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                          {group.items.length}{' '}
                          {group.items.length === 1 ? 'elemento' : 'elementos'}
                        </span>
                        <ChevronDown className="size-4 text-slate-500 transition-transform group-open:rotate-180" />
                      </span>
                    </summary>
                    <div className="grid gap-6 border-t border-slate-200 bg-white p-4 sm:p-5">
                      {group.items.map(renderItem)}
                    </div>
                  </details>
                )
              )}
            </div>
          </section>
        ))}
      </div>

      <section className="mx-4 mb-4 rounded-xl border border-amber-200 bg-amber-50/40 p-4 sm:mx-6 sm:mb-6">
        <h3 className="font-semibold text-slate-900">
          Candidatos de hallazgo{' '}
          <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
            {candidates.length}
          </span>
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          Vista preliminar. Se guardan con el trabajo; aún no son hallazgos
          confirmados.
        </p>
        {candidates.length ? (
          <ul className="mt-3 grid gap-2">
            {candidates.map((candidate) => {
              const item = snapshot.sections
                .flatMap((section) => section.items)
                .find((entry) => entry.id === candidate.workItemId);
              const severity = severityLevels.find(
                (level) => level.id === candidate.suggestedSeverityId
              );
              return (
                <li
                  key={candidate.id}
                  className="rounded-lg border border-amber-200 bg-white p-3 text-sm"
                >
                  <span className="font-medium text-slate-900">
                    {candidate.title}
                  </span>
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {candidate.status === 'PENDING'
                      ? 'Pendiente'
                      : candidate.status === 'CONFIRMED'
                      ? 'Confirmado'
                      : 'Descartado'}
                  </span>
                  <p className="mt-1 text-xs text-slate-600">
                    {item?.assetNameSnapshot ?? 'Activo'} ·{' '}
                    {item?.concept?.name ?? item?.title ?? 'Observación'} ·{' '}
                    {candidate.source === 'MANUAL'
                      ? 'Manual'
                      : candidate.source === 'ANALOG'
                      ? 'Medición'
                      : 'Opción digital'}
                    {candidate.measuredValue
                      ? ` · ${candidate.measuredValue}`
                      : ''}
                    {severity ? ` · Severidad sugerida: ${severity.name}` : ''}
                  </p>
                  {candidate.description ? (
                    <p className="mt-1 text-xs text-slate-600">
                      {candidate.description}
                    </p>
                  ) : null}
                  {candidate.source !== 'MANUAL' &&
                  values[candidate.workItemId]?.comment?.trim() ? (
                    <p className="mt-1 text-xs text-slate-600">
                      Observación: {values[candidate.workItemId].comment}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            Sin candidatos por ahora.
          </p>
        )}
      </section>

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
                void run(
                  onStart,
                  localMode
                    ? 'Trabajo iniciado y guardado localmente.'
                    : 'Trabajo iniciado correctamente.'
                )
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
                  localMode
                    ? 'Guardado localmente.'
                    : 'Borrador guardado en la base de datos.'
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

export type SectionAssetGroup = {
  assetId: string;
  assetCode: string;
  assetName: string;
  assetDepth: number;
  assetOrder: number;
  items: WorkFormItemSnapshot[];
};

export type WorkFormSectionGroup = Omit<WorkFormSectionSnapshot, 'items'> & {
  assetGroups: SectionAssetGroup[];
};

export function groupSnapshotBySection(
  snapshot: WorkTemplateSnapshot,
  rootAssetId: string
): WorkFormSectionGroup[] {
  return [...snapshot.sections]
    .sort((left, right) => left.order - right.order)
    .flatMap((section) => {
      const groups = new Map<string, SectionAssetGroup>();

      for (const item of section.items) {
        if (!isVisibleItem(item)) continue;
        const assetId = item.assetId ?? rootAssetId;
        const group = groups.get(assetId) ?? {
          assetId,
          assetCode: item.assetCodeSnapshot ?? '',
          assetName: item.assetNameSnapshot ?? 'Activo principal',
          assetDepth: item.assetDepth ?? 0,
          assetOrder: item.assetOrder ?? 0,
          items: [],
        };
        group.items.push(item);
        groups.set(assetId, group);
      }

      const assetGroups = [...groups.values()]
        .sort(
          (left, right) =>
            left.assetOrder - right.assetOrder ||
            left.assetName.localeCompare(right.assetName)
        )
        .map((group) => ({
          ...group,
          items: [...group.items].sort(
            (left, right) => left.order - right.order
          ),
        }));

      return assetGroups.length ? [{ ...section, assetGroups }] : [];
    });
}

function isVisibleItem(item: WorkFormItemSnapshot) {
  return (
    item.type === 'TASK' ||
    Boolean(item.concept && item.concept.type !== 'HIDDEN')
  );
}
