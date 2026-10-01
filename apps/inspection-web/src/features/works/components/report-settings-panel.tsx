import { useEffect, useState } from 'react';
import { AlertCircle, ImagePlus, LoaderCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import type { ReportOptions } from '../work-report-api';
import {
  reportSettingsApi,
  type TenantReportSettings,
} from '../report-settings-api';

const fields: Array<[keyof ReportOptions, string]> = [
  ['content', 'Contenido'],
  ['requestedBy', 'Solicitado por'],
  ['preparedBy', 'Preparado por'],
  ['distribution', 'Distribución'],
  ['receivedBy', 'Recibido conforme'],
  ['introduction', 'Introducción'],
];

export function ReportSettingsPanel({ tenantId }: { tenantId: string }) {
  const [settings, setSettings] = useState<TenantReportSettings | null>(null);
  const [defaults, setDefaults] = useState<ReportOptions>({});
  const [loading, setLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    reportSettingsApi
      .get(tenantId)
      .then((result) => {
        if (!active) return;
        setSettings(result);
        setDefaults(result.defaults);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : 'No se pudo cargar la portada.'
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tenantId, retryKey]);

  async function run(
    action: () => Promise<TenantReportSettings>,
    success: string
  ) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await action();
      setSettings(result);
      setDefaults(result.defaults);
      setMessage(success);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo guardar la portada.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <summary className="cursor-pointer font-semibold text-slate-950">
        Configurar portada predeterminada
      </summary>
      <p className="mt-3 text-sm text-slate-600">
        Estos datos se completan automáticamente en cada informe de esta
        empresa. Puedes ajustarlos antes de guardar una versión.
      </p>
      {loading ? (
        <LoaderCircle className="mt-5 size-6 animate-spin text-slate-500" />
      ) : (
        <>
          {error ? (
            <div className="mt-4">
              <p role="alert" className="flex gap-2 text-sm text-red-700">
                <AlertCircle className="size-4 shrink-0" /> {error}
              </p>
              {!settings ? (
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => setRetryKey((current) => current + 1)}
                >
                  Reintentar
                </Button>
              ) : null}
            </div>
          ) : null}
          {message ? (
            <p role="status" className="mt-4 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <div className="flex h-20 w-40 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3">
              <img
                src={settings?.logoUrl || '/gridassets-icon.svg'}
                alt={
                  settings?.logoUrl
                    ? 'Logo de la empresa'
                    : 'Logo de GridAssets'
                }
                className="block h-full w-full min-h-0 min-w-0 object-contain"
              />
            </div>
            <div>
              <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-800 hover:bg-slate-50">
                <ImagePlus className="size-4" /> Subir logo de la empresa
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  disabled={busy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file)
                      void run(
                        () => reportSettingsApi.uploadLogo(tenantId, file),
                        'Logo actualizado.'
                      );
                    event.target.value = '';
                  }}
                />
              </label>
              {settings?.logoUrl ? (
                <button
                  type="button"
                  className="ml-3 text-sm font-medium text-slate-600 underline"
                  disabled={busy}
                  onClick={() =>
                    void run(
                      () => reportSettingsApi.removeLogo(tenantId),
                      'Se restauró el logo de GridAssets.'
                    )
                  }
                >
                  Usar GridAssets
                </button>
              ) : null}
              <p className="mt-2 text-xs text-slate-500">
                PNG, JPG o WebP · máximo 2 MB.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {fields.map(([key, label]) => (
              <label
                key={key}
                className={`text-sm font-medium text-slate-700 ${
                  key === 'introduction' ? 'sm:col-span-2' : ''
                }`}
              >
                {label}
                {key === 'introduction' ? (
                  <textarea
                    value={defaults[key] ?? ''}
                    onChange={(event) =>
                      setDefaults((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                    rows={3}
                    maxLength={4000}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                  />
                ) : (
                  <input
                    value={defaults[key] ?? ''}
                    onChange={(event) =>
                      setDefaults((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                    maxLength={4000}
                    className="mt-2 h-10 w-full rounded-lg border border-slate-300 px-3 text-slate-900"
                  />
                )}
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Al aprobar una versión final, “Aprobado por” se reemplaza por el
            nombre de la persona autenticada.
          </p>
          <Button
            className="mt-4"
            disabled={busy || !settings}
            onClick={() =>
              void run(
                () => reportSettingsApi.saveDefaults(tenantId, defaults),
                'Valores predeterminados guardados.'
              )
            }
          >
            Guardar configuración
          </Button>
        </>
      )}
    </details>
  );
}
