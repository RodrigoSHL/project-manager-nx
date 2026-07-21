'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Download,
  FileWarning,
  Loader2,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { getDocumentFileContent } from '@/services/travelerProfileService';

interface DocumentViewerProps {
  fileId: string;
  title: string;
  onClose: () => void;
}

export function DocumentViewer({ fileId, title, onClose }: DocumentViewerProps) {
  const [url, setUrl] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [fileName, setFileName] = useState('documento');
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let objectUrl = '';
    let cancelled = false;

    getDocumentFileContent(fileId)
      .then((file) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(file.blob);
        setUrl(objectUrl);
        setMimeType(file.mimeType);
        setFileName(file.fileName);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(
            reason instanceof Error
              ? reason.message
              : 'No se pudo cargar el documento'
          );
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const canPreview =
    mimeType === 'application/pdf' || mimeType.startsWith('image/');
  const browserUnsupportedImage = ['image/heic', 'image/heif'].includes(mimeType);

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/55 p-0 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-viewer-title"
    >
      <section className="flex h-[100dvh] w-full flex-col overflow-hidden bg-slate-100 shadow-2xl sm:h-[calc(100dvh-2rem)] sm:max-w-[1500px] sm:rounded-2xl sm:border sm:border-slate-200">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Vista segura
            </p>
            <h2 id="document-viewer-title" className="truncate font-bold text-slate-900">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {url && (
              <a
                href={url}
                download={fileName}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Download className="size-4" />
                <span className="hidden sm:inline">Descargar</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar visor"
              className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-700"
            >
              <X className="size-5" />
            </button>
          </div>
        </header>

        <div className="relative flex h-0 flex-1 items-center justify-center overflow-hidden bg-slate-100 p-3 sm:p-5">
          {!url && !error && (
            <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
              <Loader2 className="size-8 animate-spin text-blue-600" />
              Cargando documento protegido…
            </div>
          )}
          {error && (
            <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
              <FileWarning className="mx-auto size-10 text-red-500" />
              <p className="mt-3 font-semibold text-slate-900">No pudimos abrir el archivo</p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          )}
          {url && mimeType === 'application/pdf' && (
            <iframe
              src={url}
              title={`Vista previa de ${title}`}
              className="h-full w-full rounded-xl border border-slate-200 bg-white shadow-lg"
            />
          )}
          {url && mimeType.startsWith('image/') && !browserUnsupportedImage && (
            <div className="relative h-full w-full overflow-auto rounded-xl">
              <div className="flex min-h-full min-w-full items-center justify-center p-1">
                <img
                  src={url}
                  alt={`Vista previa de ${title}`}
                  style={{ transform: `scale(${zoom})` }}
                  className="block h-auto max-h-[calc(100dvh-9rem)] w-auto max-w-full origin-center rounded-lg object-contain shadow-2xl transition-transform duration-150"
                />
              </div>
              <div className="fixed bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-slate-200 bg-white/95 p-1.5 text-slate-700 shadow-xl backdrop-blur sm:bottom-7">
                <button
                  type="button"
                  onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}
                  disabled={zoom <= 0.5}
                  aria-label="Alejar"
                  className="flex size-10 items-center justify-center rounded-xl hover:bg-slate-100 disabled:opacity-35"
                >
                  <ZoomOut className="size-5" />
                </button>
                <span className="min-w-14 text-center text-xs font-semibold">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((value) => Math.min(3, value + 0.25))}
                  disabled={zoom >= 3}
                  aria-label="Acercar"
                  className="flex size-10 items-center justify-center rounded-xl hover:bg-slate-100 disabled:opacity-35"
                >
                  <ZoomIn className="size-5" />
                </button>
                <div className="mx-1 h-6 w-px bg-slate-200" />
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  aria-label="Restablecer zoom"
                  className="flex size-10 items-center justify-center rounded-xl hover:bg-slate-100"
                >
                  <RotateCcw className="size-4" />
                </button>
              </div>
            </div>
          )}
          {url && (!canPreview || browserUnsupportedImage) && (
            <div className="max-w-md rounded-2xl border bg-white p-6 text-center shadow-sm">
              <FileWarning className="mx-auto size-10 text-amber-500" />
              <p className="mt-3 font-semibold text-slate-900">
                Este formato no tiene vista previa en tu navegador
              </p>
              <p className="mt-1 text-sm text-slate-500">
                El archivo está disponible de forma segura mediante el botón Descargar.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>,
    document.body
  );
}
