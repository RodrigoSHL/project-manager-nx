'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  ExternalLink,
  Eye,
  FileBadge2,
  FolderLock,
  Link2,
  Loader2,
  Plus,
  ShieldCheck,
  Unlink,
  X,
} from 'lucide-react';
import { DocumentViewer } from '@/components/profile/DocumentViewer';
import {
  createTripChecklistItem,
  getDocuments,
  getTripDocumentChecklist,
  getTripDocuments,
  linkDocumentToTrip,
  TravelDocument,
  TripDocumentChecklistItem,
  unlinkDocumentFromTrip,
  updateTripChecklistItem,
} from '@/services/travelerProfileService';

interface TripDocumentsSectionProps {
  tripId: string;
  tripTitle: string;
}

const DOCUMENT_LABELS: Record<TravelDocument['type'], string> = {
  identity: 'Documento de identidad',
  passport: 'Pasaporte',
  visa: 'Visa o permiso',
  immigration_permit: 'Permiso migratorio',
  driver_license: 'Licencia de conducir',
  international_driver_permit: 'Permiso internacional',
  vaccination: 'Vacunación',
  prescription: 'Receta médica',
  medical_certificate: 'Certificado médico',
  travel_insurance: 'Seguro de viaje',
  assistance_certificate: 'Certificado de asistencia',
  accommodation: 'Alojamiento',
  other: 'Otro documento',
};

function formatDate(value?: string) {
  if (!value) return 'Sin vencimiento';
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(
    new Date(`${value}T12:00:00`)
  );
}

export function TripDocumentsSection({
  tripId,
  tripTitle,
}: TripDocumentsSectionProps) {
  const [documents, setDocuments] = useState<TravelDocument[]>([]);
  const [linkedDocuments, setLinkedDocuments] = useState<TravelDocument[]>([]);
  const [checklist, setChecklist] = useState<TripDocumentChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [chooserOpen, setChooserOpen] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [viewer, setViewer] = useState<{ fileId: string; title: string } | null>(
    null
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [personalDocuments, tripDocuments, tripChecklist] =
        await Promise.all([
          getDocuments(),
          getTripDocuments(tripId),
          getTripDocumentChecklist(tripId),
        ]);
      setDocuments(personalDocuments);
      setLinkedDocuments(tripDocuments);
      setChecklist(tripChecklist);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'No se pudo cargar la preparación del viaje'
      );
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  const linkedIds = useMemo(
    () => new Set(linkedDocuments.map((document) => document.id)),
    [linkedDocuments]
  );
  const completed = checklist.filter((item) => item.status === 'completed').length;
  const completion = checklist.length
    ? Math.round((completed / checklist.length) * 100)
    : 0;

  async function toggleDocument(document: TravelDocument) {
    setBusyId(document.id);
    setError('');
    try {
      if (linkedIds.has(document.id)) {
        await unlinkDocumentFromTrip(tripId, document.id);
        setLinkedDocuments((current) =>
          current.filter((item) => item.id !== document.id)
        );
      } else {
        await linkDocumentToTrip(tripId, document.id);
        setLinkedDocuments((current) => [...current, document]);
      }
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'No se pudo guardar el cambio'
      );
    } finally {
      setBusyId('');
    }
  }

  async function toggleChecklistItem(item: TripDocumentChecklistItem) {
    const previous = item.status;
    const status = previous === 'completed' ? 'pending' : 'completed';
    setChecklist((current) =>
      current.map((row) => (row.id === item.id ? { ...row, status } : row))
    );
    try {
      await updateTripChecklistItem(tripId, item.id, { status });
    } catch (reason) {
      setChecklist((current) =>
        current.map((row) =>
          row.id === item.id ? { ...row, status: previous } : row
        )
      );
      setError(
        reason instanceof Error ? reason.message : 'No se pudo actualizar la lista'
      );
    }
  }

  async function addChecklistItem(event: FormEvent) {
    event.preventDefault();
    const label = newItem.trim();
    if (!label) return;
    setBusyId('new-checklist-item');
    try {
      const saved = await createTripChecklistItem(tripId, label, checklist.length);
      setChecklist((current) => [...current, saved]);
      setNewItem('');
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'No se pudo agregar el pendiente'
      );
    } finally {
      setBusyId('');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-3xl border bg-card">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin text-blue-600" />
          Preparando tus documentos para este viaje…
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
              <ShieldCheck className="size-4" />
              Preparación personal para este viaje
            </div>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Documentos de {tripTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Aquí eliges qué documentos de tu bóveda necesitarás en este viaje.
              Los originales siguen siendo privados y se guardan una sola vez en
              tu perfil.
            </p>
          </div>
          <Link
            href="/profile"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
          >
            <FolderLock className="size-4" />
            Abrir mi bóveda
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Cerrar error">
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Solo para este viaje
              </p>
              <h3 className="mt-1 text-lg font-bold text-foreground">
                Mis documentos seleccionados
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setChooserOpen((open) => !open)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="size-4" />
              Elegir desde mi bóveda
              <ChevronDown
                className={`size-4 transition ${chooserOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {chooserOpen && (
            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
              <p className="px-1 pb-2 text-xs text-slate-600">
                Esta selección no mueve ni duplica los archivos.
              </p>
              {documents.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {documents.map((document) => {
                    const selected = linkedIds.has(document.id);
                    return (
                      <button
                        type="button"
                        key={document.id}
                        disabled={busyId === document.id}
                        onClick={() => toggleDocument(document)}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition disabled:opacity-60 ${
                          selected
                            ? 'border-blue-300 bg-white text-slate-900'
                            : 'border-transparent bg-white/70 text-slate-600 hover:border-blue-200'
                        }`}
                      >
                        <span
                          className={`flex size-6 shrink-0 items-center justify-center rounded-lg ${
                            selected ? 'bg-blue-600 text-white' : 'border bg-white'
                          }`}
                        >
                          {busyId === document.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : selected ? (
                            <Check className="size-3.5" />
                          ) : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">
                            {document.displayName}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {DOCUMENT_LABELS[document.type]}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed bg-white p-5 text-center text-sm text-slate-600">
                  Tu bóveda todavía está vacía.{' '}
                  <Link href="/profile" className="font-semibold text-blue-700">
                    Agrega tu primer documento
                  </Link>
                  .
                </div>
              )}
            </div>
          )}

          {linkedDocuments.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {linkedDocuments.map((document) => (
                <article
                  key={document.id}
                  className="rounded-2xl border bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <FileBadge2 className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <h4 className="truncate font-semibold text-foreground">
                          {document.displayName}
                        </h4>
                        <p className="truncate text-xs text-muted-foreground">
                          {DOCUMENT_LABELS[document.type]}
                          {document.maskedNumber ? ` · ${document.maskedNumber}` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleDocument(document)}
                      disabled={busyId === document.id}
                      title="Quitar de este viaje"
                      aria-label={`Quitar ${document.displayName} de este viaje`}
                      className="flex size-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      {busyId === document.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Unlink className="size-4" />
                      )}
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3 text-xs">
                    <span
                      className={
                        document.status === 'expired'
                          ? 'font-semibold text-red-600'
                          : document.status === 'expiring'
                            ? 'font-semibold text-amber-600'
                            : 'text-slate-500'
                      }
                    >
                      {formatDate(document.expiresAt)}
                    </span>
                    {document.fileIds.length ? (
                      <button
                        type="button"
                        onClick={() =>
                          setViewer({
                            fileId: document.fileIds[0],
                            title: document.displayName,
                          })
                        }
                        className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-900"
                      >
                        <Eye className="size-4" />
                        Ver archivo
                      </button>
                    ) : (
                      <Link href="/profile" className="font-semibold text-blue-700">
                        Adjuntar archivo
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed p-8 text-center">
              <Link2 className="mx-auto size-8 text-slate-300" />
              <p className="mt-3 font-semibold text-foreground">
                Aún no seleccionaste documentos
              </p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Elige desde tu bóveda los documentos que llevarás a {tripTitle}.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                Checklist personal
              </p>
              <h3 className="mt-1 text-lg font-bold text-foreground">
                Antes de partir
              </h3>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {completed}/{checklist.length}
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {completion}% de tu preparación completada
          </p>

          <div className="mt-5 space-y-1">
            {checklist.map((item) => {
              const checked = item.status === 'completed';
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => toggleChecklistItem(item)}
                  className="flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-muted"
                >
                  {checked ? (
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="mt-0.5 size-5 shrink-0 text-slate-300" />
                  )}
                  <span
                    className={`text-sm ${
                      checked ? 'text-slate-400 line-through' : 'text-slate-700'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <form onSubmit={addChecklistItem} className="mt-4 flex gap-2 border-t pt-4">
            <input
              value={newItem}
              onChange={(event) => setNewItem(event.target.value)}
              maxLength={180}
              placeholder="Agregar pendiente…"
              className="h-10 min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              disabled={!newItem.trim() || busyId === 'new-checklist-item'}
              aria-label="Agregar pendiente"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-40"
            >
              {busyId === 'new-checklist-item' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
            </button>
          </form>
        </div>
      </div>

      {viewer && (
        <DocumentViewer
          fileId={viewer.fileId}
          title={viewer.title}
          onClose={() => setViewer(null)}
        />
      )}
    </section>
  );
}
