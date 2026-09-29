import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import type { SeverityLevel } from '../../concepts/models';
import type {
  Finding,
  FindingCandidate,
  Work,
  WorkTemplateSnapshot,
} from '../models';

type FindingInput = {
  title: string;
  description?: string;
  severityId?: string | null;
  manHours?: number | null;
  materials?: string;
};
type Props = {
  work: Work;
  snapshot: WorkTemplateSnapshot;
  candidates: FindingCandidate[];
  findings: Finding[];
  severities: SeverityLevel[];
  canReview: boolean;
  online: boolean;
  busy: boolean;
  onConfirm: (candidateId: string, input: FindingInput) => Promise<void>;
  onDiscard: (candidateId: string, reason?: string) => Promise<void>;
  onFinalize: () => Promise<void>;
};

export function FindingReview({
  work,
  snapshot,
  candidates,
  findings,
  severities,
  canReview,
  online,
  busy,
  onConfirm,
  onDiscard,
  onFinalize,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [localBusy, setLocalBusy] = useState(false);
  const items = snapshot.sections.flatMap((section) => section.items);
  const itemOrder = new Map(items.map((item, index) => [item.id, index]));
  const sorted = [...candidates].sort(
    (a, b) =>
      (itemOrder.get(a.workItemId) ?? 999999) -
        (itemOrder.get(b.workItemId) ?? 999999) ||
      a.source.localeCompare(b.source) ||
      a.id.localeCompare(b.id)
  );
  const confirmed = candidates.filter(
    (item) => item.status === 'CONFIRMED'
  ).length;
  const discarded = candidates.filter(
    (item) => item.status === 'DISCARDED'
  ).length;
  const pending = candidates.length - confirmed - discarded;
  const finalFindings = [...findings].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)
  );

  async function execute(action: () => Promise<void>) {
    setError(null);
    setLocalBusy(true);
    try {
      await action();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo guardar la revisión.'
      );
    } finally {
      setLocalBusy(false);
    }
  }

  if (work.status !== 'FINISHED' && work.status !== 'REVIEWED') return null;
  return (
    <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-xl font-semibold text-slate-950">
        Revisión de hallazgos
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {candidates.length} posibles · {pending} pendientes · {confirmed}{' '}
        confirmados · {discarded} descartados
      </p>
      {work.status === 'REVIEWED' ? (
        <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          Revisión finalizada.
        </p>
      ) : null}
      {!online && work.status === 'FINISHED' ? (
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          Puedes consultar los datos descargados. La revisión se realiza con
          conexión.
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-5 space-y-4">
        {sorted.map((candidate) => {
          const item = items.find((row) => row.id === candidate.workItemId);
          const finding = finalFindings.find(
            (row) => row.sourceCandidateId === candidate.id
          );
          const severity = severities.find(
            (row) => row.id === candidate.suggestedSeverityId
          );
          return (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              finding={finding}
              assetName={item?.assetNameSnapshot ?? 'Activo'}
              conceptName={item?.concept?.name}
              unit={item?.concept?.unit}
              suggestedSeverity={severity?.name}
              severities={severities}
              editable={canReview && online && work.status === 'FINISHED'}
              busy={busy || localBusy}
              onConfirm={(input) =>
                execute(() => onConfirm(candidate.id, input))
              }
              onDiscard={(reason) =>
                execute(() => onDiscard(candidate.id, reason))
              }
            />
          );
        })}
        {sorted.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-slate-500">
            No se detectaron posibles hallazgos.
          </p>
        ) : null}
      </div>

      {work.status === 'FINISHED' && canReview && online ? (
        <div className="mt-5">
          <Button
            disabled={busy || localBusy || pending > 0}
            onClick={() => execute(onFinalize)}
          >
            Finalizar revisión
          </Button>
          {pending > 0 ? (
            <p className="mt-2 text-sm text-amber-700">
              Aún existen {pending} posibles hallazgos pendientes de revisión.
            </p>
          ) : null}
        </div>
      ) : null}

      <h3 className="mt-8 text-lg font-semibold text-slate-950">
        Hallazgos confirmados
      </h3>
      {finalFindings.length ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">Nº</th>
                <th className="p-3">Activo</th>
                <th className="p-3">Hallazgo</th>
                <th className="p-3">Criticidad</th>
                <th className="p-3">HH</th>
                <th className="p-3">Materiales</th>
              </tr>
            </thead>
            <tbody>
              {finalFindings.map((finding, index) => (
                <tr
                  key={finding.id}
                  id={`finding-${finding.id}`}
                  className="scroll-mt-24 border-b target:bg-amber-50"
                >
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">{finding.assetNameSnapshot}</td>
                  <td className="p-3">{finding.title}</td>
                  <td className="p-3">
                    {severities.find((level) => level.id === finding.severityId)
                      ?.name ?? '—'}
                  </td>
                  <td className="p-3">{finding.manHours ?? '—'}</td>
                  <td className="p-3">{finding.materials || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">
          Aún no hay hallazgos definitivos.
        </p>
      )}
    </section>
  );
}

function CandidateCard({
  candidate,
  finding,
  assetName,
  conceptName,
  unit,
  suggestedSeverity,
  severities,
  editable,
  busy,
  onConfirm,
  onDiscard,
}: {
  candidate: FindingCandidate;
  finding?: Finding;
  assetName: string;
  conceptName?: string;
  unit?: string | null;
  suggestedSeverity?: string;
  severities: SeverityLevel[];
  editable: boolean;
  busy: boolean;
  onConfirm: (input: FindingInput) => Promise<void>;
  onDiscard: (reason?: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(finding?.title ?? candidate.title);
  const [description, setDescription] = useState(
    finding?.description ?? candidate.description ?? ''
  );
  const [severityId, setSeverityId] = useState(
    finding?.severityId ?? candidate.suggestedSeverityId ?? ''
  );
  const [hours, setHours] = useState(finding?.manHours?.toString() ?? '');
  const [materials, setMaterials] = useState(finding?.materials ?? '');
  const [discardReason, setDiscardReason] = useState(
    candidate.discardReason ?? ''
  );
  const value = Number.parseFloat(candidate.measuredValue ?? '');
  const difference =
    Number.isFinite(value) && candidate.source === 'ANALOG'
      ? candidate.maxValue != null && value > candidate.maxValue
        ? value - candidate.maxValue
        : candidate.minValue != null && value < candidate.minValue
        ? value - candidate.minValue
        : null
      : null;
  const fieldClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
  return (
    <article className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-950">{assetName}</p>
          <p className="text-sm text-slate-600">
            {conceptName ?? 'Observación manual'} ·{' '}
            {candidate.source === 'ANALOG'
              ? 'Analógico'
              : candidate.source === 'DIGITAL'
              ? 'Digital'
              : 'Manual'}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          {candidate.status === 'PENDING'
            ? 'Pendiente'
            : candidate.status === 'CONFIRMED'
            ? 'Confirmado'
            : 'Descartado'}
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-700">
        {candidate.description || candidate.title}
      </p>
      {candidate.measuredValue ? (
        <p className="mt-2 text-sm">
          <strong>Valor:</strong> {candidate.measuredValue}
          {unit && !candidate.measuredValue.includes(unit) ? ` ${unit}` : ''}
        </p>
      ) : null}
      {candidate.source === 'ANALOG' ? (
        <p className="text-sm text-slate-600">
          Rango esperado: {candidate.minValue ?? '—'} a{' '}
          {candidate.maxValue ?? '—'} {unit ?? ''}
          {difference != null
            ? ` · Diferencia: ${difference > 0 ? '+' : ''}${difference} ${
                unit ?? ''
              }`
            : ''}
        </p>
      ) : null}
      <p className="mt-2 text-sm text-slate-600">
        Criticidad sugerida: {suggestedSeverity ?? 'Sin sugerencia'}
      </p>
      {candidate.status === 'DISCARDED' && candidate.discardReason ? (
        <p className="mt-2 text-sm text-slate-600">
          Motivo: {candidate.discardReason}
        </p>
      ) : null}
      {candidate.status !== 'DISCARDED' && (editable || finding) ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Título
            <input
              className={fieldClass}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={!editable}
              maxLength={240}
            />
          </label>
          <label className="text-sm font-medium">
            Criticidad final
            <select
              className={fieldClass}
              value={severityId}
              onChange={(event) => setSeverityId(event.target.value)}
              disabled={!editable}
            >
              <option value="">Sin asignar</option>
              {severities.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            Descripción
            <textarea
              className={fieldClass}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={!editable}
              rows={3}
            />
          </label>
          <label className="text-sm font-medium">
            HH
            <input
              className={fieldClass}
              type="number"
              min="0"
              step="any"
              value={hours}
              onChange={(event) => setHours(event.target.value)}
              disabled={!editable}
            />
          </label>
          <label className="text-sm font-medium">
            Materiales
            <textarea
              className={fieldClass}
              value={materials}
              onChange={(event) => setMaterials(event.target.value)}
              disabled={!editable}
              rows={2}
            />
          </label>
          {editable ? (
            <div className="sm:col-span-2">
              <Button
                disabled={
                  busy ||
                  !title.trim() ||
                  (hours !== '' &&
                    (!Number.isFinite(Number(hours)) || Number(hours) < 0))
                }
                onClick={() =>
                  onConfirm({
                    title: title.trim(),
                    description: description.trim(),
                    severityId: severityId || null,
                    manHours: hours === '' ? null : Number(hours),
                    materials: materials.trim(),
                  })
                }
              >
                {finding ? 'Guardar cambios' : 'Confirmar hallazgo'}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
      {candidate.status === 'PENDING' && editable ? (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="min-w-48 flex-1 text-sm font-medium">
            Motivo de descarte (opcional)
            <input
              className={fieldClass}
              value={discardReason}
              onChange={(event) => setDiscardReason(event.target.value)}
              maxLength={2000}
            />
          </label>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => onDiscard(discardReason.trim())}
          >
            Descartar
          </Button>
        </div>
      ) : null}
    </article>
  );
}
