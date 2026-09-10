import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertCircle, ArrowLeft, LoaderCircle } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/page-header';
import { Button } from '../components/ui/button';
import type { Asset } from '../features/assets/models';
import {
  createWorkSchema,
  type CreateWorkFormValue,
} from '../features/works/work-schema';
import { useWorkCatalog } from '../features/works/use-work-catalog';
import { useEffectiveWorkTypes } from '../features/work-types/use-effective-work-types';

type FieldErrors = Partial<Record<keyof CreateWorkFormValue, string>>;

export function NewWorkPage() {
  const [params] = useSearchParams();
  const tenantId = params.get('tenantId') ?? '';
  const siteId = params.get('siteId') ?? '';
  const assetId = params.get('assetId') ?? '';
  const works = useWorkCatalog(tenantId);
  const asset = works.catalog?.assets.find(
    (item) =>
      item.id === assetId &&
      item.siteId === siteId &&
      item.tenantId === tenantId
  );
  const site = works.catalog?.sites.find(
    (item) => item.id === siteId && item.tenantId === tenantId
  );

  if (!tenantId || !siteId || !assetId) {
    return (
      <InvalidNewWork message="Falta identificar la empresa, el sitio o el activo." />
    );
  }
  if (works.error) {
    return <InvalidNewWork message={works.error} />;
  }
  if (works.isLoading || !works.catalog) {
    return (
      <section className="grid min-h-72 place-items-center rounded-xl border border-slate-200 bg-white">
        <div className="text-center">
          <LoaderCircle className="mx-auto size-8 animate-spin text-slate-500" />
          <p className="mt-3 text-sm text-slate-600">
            Preparando el trabajo...
          </p>
        </div>
      </section>
    );
  }
  if (!asset || !site) {
    return (
      <InvalidNewWork message="El activo no pertenece a la empresa y ubicación indicadas." />
    );
  }

  return <NewWorkForm asset={asset} siteName={site.name} />;
}

function NewWorkForm({ asset, siteName }: { asset: Asset; siteName: string }) {
  const navigate = useNavigate();
  const works = useWorkCatalog(asset.tenantId);
  const { workTypes, isLoading, error } = useEffectiveWorkTypes(asset);
  const availableWorkTypes = useMemo(
    () =>
      workTypes.filter((workType) =>
        works.catalog?.templates.some(
          (template) =>
            template.tenantId === asset.tenantId &&
            template.workTypeId === workType.id &&
            template.active
        )
      ),
    [asset.tenantId, workTypes, works.catalog?.templates]
  );
  const [form, setForm] = useState<CreateWorkFormValue>({
    workTypeId: '',
    title: '',
    executionDate: localDate(),
    responsible: '',
    company: '',
    status: 'DRAFT',
    notes: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (form.workTypeId || availableWorkTypes.length === 0) return;
    const first = availableWorkTypes[0];
    setForm((current) => ({
      ...current,
      workTypeId: first.id,
      title: `${first.name} · ${asset.name}`,
    }));
  }, [asset.name, availableWorkTypes, form.workTypeId]);

  function change<K extends keyof CreateWorkFormValue>(
    key: K,
    value: CreateWorkFormValue[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function changeWorkType(workTypeId: string) {
    const workType = availableWorkTypes.find((item) => item.id === workTypeId);
    setForm((current) => ({
      ...current,
      workTypeId,
      title: workType ? `${workType.name} · ${asset.name}` : current.title,
    }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = createWorkSchema.safeParse(form);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof CreateWorkFormValue;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const work = await works.createWork({
        tenantId: asset.tenantId,
        siteId: asset.siteId,
        assetId: asset.id,
        ...parsed.data,
      });
      navigate(`/works/${work.id}?tenantId=${work.tenantId}`);
    } catch (requestError) {
      setSubmitError(
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible crear el trabajo.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Link
        to="/assets"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft className="size-4" /> Volver a activos
      </Link>
      <PageHeader
        title="Nuevo trabajo"
        description="Crea una ejecución real sobre el activo seleccionado y guárdala en la base de datos."
      />
      <form
        onSubmit={submit}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <ReadonlyField
            label="Activo"
            value={`${asset.code} · ${asset.name}`}
          />
          <ReadonlyField label="Mina / Faena / Sitio" value={siteName} />
          <Field label="Tipo de trabajo" error={errors.workTypeId}>
            <select
              value={form.workTypeId}
              onChange={(event) => changeWorkType(event.target.value)}
              disabled={isLoading || availableWorkTypes.length === 0}
              className={inputClass}
            >
              <option value="">Selecciona un tipo</option>
              {availableWorkTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Estado inicial" error={errors.status}>
            <select
              value={form.status}
              onChange={(event) =>
                change(
                  'status',
                  event.target.value as CreateWorkFormValue['status']
                )
              }
              className={inputClass}
            >
              <option value="DRAFT">Borrador</option>
              <option value="IN_PROGRESS">En progreso</option>
            </select>
          </Field>
          <Field label="Título" error={errors.title} className="md:col-span-2">
            <input
              value={form.title}
              onChange={(event) => change('title', event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Fecha de ejecución" error={errors.executionDate}>
            <input
              type="date"
              value={form.executionDate}
              onChange={(event) => change('executionDate', event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Responsable" error={errors.responsible}>
            <input
              value={form.responsible}
              onChange={(event) => change('responsible', event.target.value)}
              placeholder="Ej. Juan Pérez"
              className={inputClass}
            />
          </Field>
          <Field label="Empresa / cuadrilla" error={errors.company}>
            <input
              value={form.company ?? ''}
              onChange={(event) => change('company', event.target.value)}
              placeholder="Opcional"
              className={inputClass}
            />
          </Field>
          <Field
            label="Observaciones"
            error={errors.notes}
            className="md:col-span-2"
          >
            <textarea
              rows={4}
              value={form.notes ?? ''}
              onChange={(event) => change('notes', event.target.value)}
              placeholder="Opcional"
              className={`${inputClass} h-auto py-3`}
            />
          </Field>
        </div>
        {error ? <ErrorMessage message={error} /> : null}
        {!isLoading && availableWorkTypes.length === 0 ? (
          <ErrorMessage message="No hay tipos de trabajo habilitados que tengan una plantilla activa." />
        ) : null}
        {submitError ? <ErrorMessage message={submitError} /> : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button asChild type="button" variant="outline">
            <Link to="/assets">Cancelar</Link>
          </Button>
          <Button
            type="submit"
            disabled={
              isSubmitting || isLoading || availableWorkTypes.length === 0
            }
          >
            {isSubmitting ? 'Creando...' : 'Crear trabajo'}
          </Button>
        </div>
      </form>
    </>
  );
}

const inputClass =
  'mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-50';

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`text-sm font-medium text-slate-700 ${className ?? ''}`}>
      {label}
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : null}
    </label>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className="mt-2 flex min-h-11 items-center rounded-lg bg-slate-100 px-3 text-sm font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle className="size-4 shrink-0" /> {message}
    </p>
  );
}

function InvalidNewWork({ message }: { message: string }) {
  return (
    <section className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
      <AlertCircle className="mx-auto size-8 text-red-500" />
      <h1 className="mt-3 font-semibold text-slate-950">
        No se puede crear el trabajo
      </h1>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
      <Button asChild className="mt-5" variant="outline">
        <Link to="/assets">Volver a activos</Link>
      </Button>
    </section>
  );
}

function localDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}
