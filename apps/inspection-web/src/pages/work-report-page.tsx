import { useEffect, useState } from 'react';
import { ArrowLeft, Download, LoaderCircle } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTenantAccess } from '../features/tenants/tenant-access-context';
import { useOffline } from '../features/offline/offline-context';
import { loadWorkPhotoUrl } from '../features/works/work-photo-api';
import {
  GeneratedReport,
  groupReportSections,
  ReportOptions,
  WorkReport,
  workReportApi,
} from '../features/works/work-report-api';

const fields: Array<[keyof ReportOptions, string]> = [
  ['content', 'Contenido'],
  ['requestedBy', 'Solicitado por'],
  ['preparedBy', 'Preparado por'],
  ['approvedBy', 'Aprobado por'],
  ['distribution', 'Distribución'],
  ['receivedBy', 'Recibido conforme'],
  ['introduction', 'Introducción'],
];

export function WorkReportPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const tenantId = params.get('tenantId') || '';
  const { mode } = useOffline();
  const access = useTenantAccess();
  const [live, setLive] = useState<WorkReport | null>(null);
  const [versions, setVersions] = useState<GeneratedReport[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [options, setOptions] = useState<ReportOptions>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canReview = access.canReviewTenant(tenantId);

  useEffect(() => {
    if (!tenantId || !id || mode !== 'REMOTE') return;
    let active = true;
    Promise.all([
      workReportApi.preview(tenantId, id),
      workReportApi.versions(tenantId, id),
    ])
      .then(([report, saved]) => {
        if (active) {
          setLive(report);
          setVersions(saved);
          setOptions({ introduction: report.header.introduction || '' });
        }
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : 'No se pudo cargar el informe.'
          );
      });
    return () => {
      active = false;
    };
  }, [tenantId, id, mode]);

  const saved = versions.find((version) => version.id === selected);
  const report =
    saved?.reportSnapshot ||
    (live ? { ...live, header: { ...live.header, ...options } } : null);

  async function save(status: 'DRAFT' | 'FINAL') {
    setBusy(true);
    setError('');
    try {
      const version = await workReportApi.create(tenantId, id, status, options);
      setVersions((current) => [version, ...current]);
      setSelected(version.id);
      return version;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No se pudo guardar el informe.'
      );
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function download() {
    setBusy(true);
    setError('');
    try {
      // Persist the exact optional fields shown in the preview before exporting.
      const version =
        saved || (await workReportApi.create(tenantId, id, 'DRAFT', options));
      if (!saved) {
        setVersions((current) => [version, ...current]);
        setSelected(version.id);
      }
      await workReportApi.pdf(tenantId, id, version.id);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'No se pudo generar el PDF.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      <Link
        to={`/works/${id}?tenantId=${encodeURIComponent(tenantId)}`}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft className="size-4" /> Volver al trabajo
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">
            Informe del trabajo
          </h1>
          <p className="text-sm text-slate-600">
            Vista previa y versiones guardadas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canReview &&
            mode === 'REMOTE' &&
            !saved &&
            ['FINISHED', 'REVIEWED'].includes(live?.header.status || '') && (
              <button
                onClick={() => void save('DRAFT')}
                disabled={busy || !live}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Guardar borrador
              </button>
            )}
          {canReview &&
            mode === 'REMOTE' &&
            !saved &&
            live?.header.status === 'REVIEWED' && (
              <button
                onClick={() => void save('FINAL')}
                disabled={busy}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Finalizar informe
              </button>
            )}
          <button
            onClick={() => void download()}
            disabled={
              busy ||
              !report ||
              mode !== 'REMOTE' ||
              (!saved &&
                (!canReview ||
                  !['FINISHED', 'REVIEWED'].includes(
                    live?.header.status || ''
                  )))
            }
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            <Download className="size-4" /> Generar PDF
          </button>
        </div>
      </div>
      {mode !== 'REMOTE' && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          La vista del informe requiere conexión. Tu trabajo local sigue
          disponible.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      {versions.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <label
            htmlFor="report-version"
            className="mb-2 block text-sm font-medium"
          >
            Versión del informe
          </label>
          <select
            id="report-version"
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Vista actual del trabajo</option>
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                v{version.version} ·{' '}
                {version.status === 'FINAL' ? 'Final' : 'Borrador'} ·{' '}
                {new Date(version.generatedAt).toLocaleString('es-CL')}
              </option>
            ))}
          </select>
        </div>
      )}
      {!selected && canReview && report && (
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
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
                  value={options[key] ?? ''}
                  onChange={(event) =>
                    setOptions((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-slate-300 p-2"
                />
              ) : (
                <input
                  value={options[key] ?? ''}
                  onChange={(event) =>
                    setOptions((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-lg border border-slate-300 p-2"
                />
              )}
            </label>
          ))}
        </div>
      )}
      {!report && !error && mode === 'REMOTE' && (
        <div className="grid min-h-60 place-items-center">
          <LoaderCircle className="size-8 animate-spin" />
        </div>
      )}
      {report && <ReportDocument report={report} version={saved} />}
    </div>
  );
}

function ReportDocument({
  report,
  version,
}: {
  report: WorkReport;
  version?: GeneratedReport;
}) {
  const h = report.header;
  const sections = groupReportSections(report.sections);
  const entries: Array<[string, string | null]> = [
    ['Fecha', h.executionDate],
    ['Trabajo', h.workId],
    ['Contenido', h.content],
    ['Solicitado por', h.requestedBy],
    ['Preparado por', h.preparedBy],
    ['Aprobado por', h.approvedBy],
    ['Distribución', h.distribution],
    ['Recibido conforme', h.receivedBy],
    ['Mina / faena', h.site],
    ['Activo principal', h.asset],
    ['Tipo de trabajo', h.workType],
    ['Responsable', h.responsible],
    ['Empresa contratista', h.company],
    ['Estado', h.status],
  ];
  return (
    <article className="mx-auto max-w-[820px] space-y-8 rounded-lg border border-slate-200 bg-white px-5 py-8 shadow-sm sm:px-10">
      <header className="border-b border-slate-200 pb-5">
        {version && (
          <p
            className={`mb-3 text-xs font-semibold uppercase tracking-wide ${
              version.status === 'FINAL' ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            Informe v{version.version} ·{' '}
            {version.status === 'FINAL' ? 'Final' : 'Borrador'}
          </p>
        )}
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          {report.branding.companyName}
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-slate-950">
          {h.title}
        </h2>
        <dl className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
          {entries
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <div key={label}>
                <dt className="inline font-medium text-slate-500">{label}: </dt>
                <dd className="inline text-slate-900">{value}</dd>
              </div>
            ))}
        </dl>
      </header>
      {h.introduction && (
        <section>
          <h3 className="mb-2 text-lg font-semibold">Introducción</h3>
          <p className="whitespace-pre-wrap text-sm text-slate-700">
            {h.introduction}
          </p>
        </section>
      )}
      {sections.map((section) => (
        <section key={section.id} className="break-inside-avoid-page">
          <h3 className="border-b border-slate-200 pb-2 text-lg font-semibold">
            {section.title}
          </h3>
          {section.description && (
            <p className="mt-2 text-sm text-slate-600">{section.description}</p>
          )}
          <div className="mt-3 space-y-4">
            {(section.assetGroups ?? []).map((assetGroup) => (
              <div key={assetGroup.id} className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-600">
                  {assetGroup.assetPath}
                </h4>
                {assetGroup.items.map((item) => (
                  <div
                    key={item.id}
                    className="break-inside-avoid rounded-lg border border-slate-200 p-3 text-sm"
                  >
                    <div className="flex gap-3">
                      <span className="font-semibold text-slate-700">
                        {item.type === 'TASK'
                          ? item.completed
                            ? '✓'
                            : '○'
                          : '•'}
                      </span>
                      <div>
                        <p className="font-medium text-slate-950">
                          {item.title}
                          {item.type === 'CONCEPT' && (
                            <span className="ml-2 font-normal text-slate-700">
                              {item.value || '—'}
                            </span>
                          )}
                        </p>
                        {item.description && (
                          <p className="text-slate-600">{item.description}</p>
                        )}
                        {item.observation && (
                          <p className="mt-1 text-slate-700">
                            <span className="font-medium">Observación:</span>{' '}
                            {item.observation}
                          </p>
                        )}
                      </div>
                    </div>
                    {item.photos.length > 0 && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {item.photos.map((photo) => (
                          <ReportPhoto
                            key={photo.id}
                            id={photo.id}
                            caption={photo.caption}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      ))}
      <section>
        <h3 className="mb-2 text-lg font-semibold">
          Observaciones adicionales
        </h3>
        <p className="whitespace-pre-wrap text-sm text-slate-700">
          {report.observations || 'Sin observaciones adicionales.'}
        </p>
      </section>
      <section>
        <h3 className="mb-3 text-lg font-semibold">Hallazgos</h3>
        {report.findings.length ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-100">
                  {['Nº', 'Hallazgo', 'Criticidad', 'HH', 'Materiales'].map(
                    (label) => (
                      <th key={label} className="border border-slate-200 p-2">
                        {label}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {report.findings.map((finding) => (
                  <tr key={finding.id} className="align-top">
                    <td className="border border-slate-200 p-2">
                      {finding.number}
                    </td>
                    <td className="border border-slate-200 p-2">
                      <p className="text-slate-500">{finding.assetPath}</p>
                      <p className="font-medium">{finding.title}</p>
                      {finding.description && (
                        <p className="whitespace-pre-wrap">
                          {finding.description}
                        </p>
                      )}
                    </td>
                    <td className="border border-slate-200 p-2">
                      {finding.severity || '—'}
                    </td>
                    <td className="border border-slate-200 p-2">
                      {finding.manHours ?? '—'}
                    </td>
                    <td className="border border-slate-200 p-2">
                      {finding.materials || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            No se registraron hallazgos durante la ejecución del trabajo.
          </p>
        )}
      </section>
      <footer className="border-t border-slate-200 pt-3 text-xs text-slate-500">
        {report.branding.footerText || 'Documento generado por sistema'}
      </footer>
    </article>
  );
}

function ReportPhoto({ id, caption }: { id: string; caption: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let active = true;
    let created = '';
    loadWorkPhotoUrl(id)
      .then((loaded) => {
        created = loaded;
        if (active) setUrl(loaded);
        else URL.revokeObjectURL(loaded);
      })
      .catch(() => undefined);
    return () => {
      active = false;
      if (created) URL.revokeObjectURL(created);
    };
  }, [id]);
  return (
    <figure className="break-inside-avoid">
      {url ? (
        <img
          src={url}
          alt={caption}
          className="max-h-72 w-full rounded object-contain"
        />
      ) : (
        <div className="grid h-40 place-items-center rounded bg-slate-100 text-xs text-slate-500">
          Cargando fotografía
        </div>
      )}
      <figcaption className="mt-1 text-xs text-slate-500">{caption}</figcaption>
    </figure>
  );
}
