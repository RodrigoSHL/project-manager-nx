import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  LoaderCircle,
  MapPin,
  UserRound,
} from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { WorkExecutionForm } from '../features/works/components/work-execution-form';
import { WorkStatusBadge } from '../features/works/components/work-status-badge';
import { formatWorkDate } from '../features/works/work-formatters';
import { useWorkCatalog } from '../features/works/use-work-catalog';

export function WorkDetailPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const tenantId = params.get('tenantId') ?? '';
  const catalog = useWorkCatalog(tenantId);
  const work = catalog.works.find(
    (item) => item.id === id && item.tenantId === tenantId
  );
  const snapshot = catalog.snapshots.find(
    (item) => item.workId === id && item.tenantId === tenantId
  );

  if (!tenantId)
    return (
      <NotFound message="El enlace no identifica la empresa del trabajo." />
    );
  if (catalog.error) return <NotFound message={catalog.error} />;
  if (catalog.isLoading || !catalog.catalog) {
    return (
      <section className="grid min-h-72 place-items-center rounded-xl border border-slate-200 bg-white">
        <LoaderCircle className="size-8 animate-spin text-slate-500" />
      </section>
    );
  }
  if (!work || !snapshot) {
    return (
      <NotFound message="El trabajo no existe en esta sesión o pertenece a otra empresa." />
    );
  }
  const asset = catalog.catalog.assets.find(
    (item) => item.id === work.assetId && item.tenantId === tenantId
  );
  const site = catalog.catalog.sites.find(
    (item) => item.id === work.siteId && item.tenantId === tenantId
  );
  const workType = catalog.catalog.workTypes.find(
    (item) => item.id === work.workTypeId && item.tenantId === tenantId
  );

  return (
    <>
      <Link
        to="/works"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft className="size-4" /> Volver a trabajos
      </Link>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {workType?.name ?? 'Trabajo'}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              {work.title}
            </h1>
          </div>
          <WorkStatusBadge status={work.status} />
        </div>
        <dl className="mt-6 grid gap-4 border-t border-slate-200 pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Meta
            icon={MapPin}
            label="Activo"
            value={asset ? `${asset.code} · ${asset.name}` : 'No disponible'}
          />
          <Meta
            icon={MapPin}
            label="Mina / Faena"
            value={site?.name ?? 'No disponible'}
          />
          <Meta
            icon={CalendarDays}
            label="Fecha"
            value={formatWorkDate(work.executionDate)}
          />
          <Meta icon={UserRound} label="Responsable" value={work.responsible} />
        </dl>
        {work.company || work.notes ? (
          <div className="mt-5 grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2">
            {work.company ? (
              <p>
                <span className="text-slate-500">Empresa/cuadrilla:</span>{' '}
                <span className="font-medium text-slate-800">
                  {work.company}
                </span>
              </p>
            ) : null}
            {work.notes ? (
              <p>
                <span className="text-slate-500">Observaciones:</span>{' '}
                <span className="text-slate-700">{work.notes}</span>
              </p>
            ) : null}
          </div>
        ) : null}
      </section>
      <WorkExecutionForm
        work={work}
        snapshot={snapshot}
        responses={catalog.responses}
        taskCompletions={catalog.taskCompletions}
        onSave={(values) => catalog.saveResponses(tenantId, work.id, values)}
        onStart={() => catalog.startWork(tenantId, work.id)}
        onFinish={(values) => catalog.finishWork(tenantId, work.id, values)}
      />
    </>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
      <div>
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="mt-1 font-medium text-slate-800">{value}</dd>
      </div>
    </div>
  );
}

function NotFound({ message }: { message: string }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <AlertCircle className="mx-auto size-8 text-slate-400" />
      <h1 className="mt-3 font-semibold text-slate-950">
        Trabajo no disponible
      </h1>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
      <Button asChild variant="outline" className="mt-5">
        <Link to="/works">Volver al listado</Link>
      </Button>
    </section>
  );
}
