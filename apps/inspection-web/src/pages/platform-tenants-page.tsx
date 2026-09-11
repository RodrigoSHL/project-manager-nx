import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  ClipboardList,
  Factory,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { PlatformTenantForm } from '../features/platform/components/platform-tenant-form';
import type {
  PlatformTenant,
  PlatformTenantUser,
} from '../features/platform/models';
import {
  PlatformApiError,
  platformTenantApi,
} from '../features/platform/platform-api';
import { useAuth } from '../features/auth/auth-context';
import type { PlatformTenantFormValue } from '../features/platform/platform-schema';

type PanelMode = 'detail' | 'create' | 'edit';

export function PlatformTenantsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<PanelMode>('detail');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenantUsers, setTenantUsers] = useState<PlatformTenantUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [mutatingUserId, setMutatingUserId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    platformTenantApi
      .list(controller.signal)
      .then((items) => {
        setTenants(items);
        setSelectedId((current) =>
          current && items.some((item) => item.id === current)
            ? current
            : items[0]?.id ?? null
        );
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;
        handleApiError(cause);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedId || mode !== 'detail') {
      setTenantUsers([]);
      return;
    }
    const controller = new AbortController();
    setIsLoadingUsers(true);
    platformTenantApi
      .listUsers(selectedId, controller.signal)
      .then(setTenantUsers)
      .catch((cause) => {
        if (!controller.signal.aborted) handleApiError(cause);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingUsers(false);
      });
    return () => controller.abort();
  }, [mode, selectedId]);

  const selected = tenants.find((tenant) => tenant.id === selectedId) ?? null;
  const filteredTenants = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es');
    if (!normalized) return tenants;
    return tenants.filter(
      (tenant) =>
        tenant.name.toLocaleLowerCase('es').includes(normalized) ||
        tenant.code.toLocaleLowerCase('es').includes(normalized)
    );
  }, [query, tenants]);
  const activeCount = tenants.filter((tenant) => tenant.active).length;
  const siteCount = tenants.reduce(
    (total, tenant) => total + tenant.siteCount,
    0
  );

  async function saveTenant(value: PlatformTenantFormValue) {
    setIsMutating(true);
    setError(null);
    try {
      const saved =
        mode === 'edit' && selected
          ? await platformTenantApi.update(selected.id, value)
          : await platformTenantApi.create(value);
      setTenants((current) => {
        const exists = current.some((tenant) => tenant.id === saved.id);
        const next = exists
          ? current.map((tenant) => (tenant.id === saved.id ? saved : tenant))
          : [...current, saved];
        return next.sort(
          (left, right) =>
            Number(right.active) - Number(left.active) ||
            left.name.localeCompare(right.name, 'es')
        );
      });
      setSelectedId(saved.id);
      setMode('detail');
    } catch (cause) {
      handleApiError(cause);
      throw cause;
    } finally {
      setIsMutating(false);
    }
  }

  async function updateUserAccess(user: PlatformTenantUser, enabled: boolean) {
    if (!selected) return;
    setMutatingUserId(user.id);
    setError(null);
    try {
      await platformTenantApi.setUserAccess(selected.id, user.id, enabled);
      setTenantUsers((current) =>
        current.map((candidate) =>
          candidate.id === user.id
            ? { ...candidate, hasAccess: enabled }
            : candidate
        )
      );
    } catch (cause) {
      handleApiError(cause);
    } finally {
      setMutatingUserId(null);
    }
  }

  function handleApiError(cause: unknown) {
    if (cause instanceof PlatformApiError && cause.status === 401) {
      auth.logout();
      navigate('/login?redirect=/platform/tenants', { replace: true });
      return;
    }
    setError(
      cause instanceof Error
        ? cause.message
        : 'No fue posible cargar los clientes.'
    );
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            Control global
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
            Clientes
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Crea y administra las empresas que utilizarán GridAssets. Esta vista
            no depende del tenant seleccionado en la operación.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setMode('create');
            setError(null);
          }}
        >
          <Plus /> Nuevo cliente
        </Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Metric label="Clientes" value={tenants.length} icon={Building2} />
        <Metric label="Clientes activos" value={activeCount} icon={Factory} />
        <Metric
          label="Sitios configurados"
          value={siteCount}
          icon={ClipboardList}
        />
      </div>

      {error ? (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="mt-5 grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)]">
        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre o código"
                className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </label>
          </div>

          {isLoading ? (
            <div className="grid min-h-64 place-items-center">
              <LoaderCircle className="size-7 animate-spin text-slate-500" />
            </div>
          ) : null}

          {!isLoading && filteredTenants.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              {query
                ? 'No hay clientes que coincidan con la búsqueda.'
                : 'Todavía no existen clientes.'}
            </div>
          ) : null}

          {!isLoading ? (
            <div className="divide-y divide-slate-100">
              {filteredTenants.map((tenant) => (
                <button
                  key={tenant.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(tenant.id);
                    setMode('detail');
                    setError(null);
                  }}
                  className={`flex w-full items-center gap-4 px-4 py-4 text-left transition-colors ${
                    selectedId === tenant.id && mode !== 'create'
                      ? 'bg-slate-100'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
                    <Building2 className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-950">
                      {tenant.name}
                    </span>
                    <span className="mt-1 block truncate font-mono text-xs text-slate-500">
                      {tenant.code}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      tenant.active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tenant.active ? 'Activo' : 'Inactivo'}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <div className="min-w-0 lg:sticky lg:top-24">
          {mode === 'create' ? (
            <PlatformTenantForm
              isSubmitting={isMutating}
              onCancel={() => setMode('detail')}
              onSubmit={saveTenant}
            />
          ) : null}

          {mode === 'edit' && selected ? (
            <PlatformTenantForm
              tenant={selected}
              isSubmitting={isMutating}
              onCancel={() => setMode('detail')}
              onSubmit={saveTenant}
            />
          ) : null}

          {mode === 'detail' && selected ? (
            <div className="space-y-4">
              <TenantDetail tenant={selected} onEdit={() => setMode('edit')} />
              <TenantAccess
                users={tenantUsers}
                isLoading={isLoadingUsers}
                mutatingUserId={mutatingUserId}
                onChange={updateUserAccess}
              />
            </div>
          ) : null}

          {mode === 'detail' && !selected && !isLoading ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Selecciona un cliente o crea el primero.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function TenantAccess({
  users,
  isLoading,
  mutatingUserId,
  onChange,
}: {
  users: PlatformTenantUser[];
  isLoading: boolean;
  mutatingUserId: string | null;
  onChange: (user: PlatformTenantUser, enabled: boolean) => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
          <UserRound className="size-4" />
        </span>
        <div>
          <h2 className="font-semibold text-slate-950">Acceso de usuarios</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Los usuarios habilitados podrán ver y operar solamente este cliente.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid min-h-28 place-items-center">
          <LoaderCircle className="size-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
          {users.map((user) => {
            const globalAdmin = user.roles.includes('admin');
            const enabled = globalAdmin || user.hasAccess;
            return (
              <div
                key={user.id}
                className="flex min-w-0 items-center gap-3 py-3"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">
                    {user.name}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {user.email}
                  </span>
                </span>
                {globalAdmin ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                    <ShieldCheck className="size-3" /> Global
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={mutatingUserId === user.id}
                    onClick={() => onChange(user, !enabled)}
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition disabled:opacity-50 ${
                      enabled
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {mutatingUserId === user.id
                      ? 'Guardando…'
                      : enabled
                      ? 'Habilitado'
                      : 'Sin acceso'}
                  </button>
                )}
              </div>
            );
          })}
          {!users.length ? (
            <p className="py-5 text-center text-sm text-slate-500">
              No hay usuarios registrados.
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Building2;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="grid size-10 place-items-center rounded-lg bg-slate-100 text-slate-700">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-2xl font-semibold text-slate-950">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function TenantDetail({
  tenant,
  onEdit,
}: {
  tenant: PlatformTenant;
  onEdit: () => void;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
              tenant.active
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {tenant.active ? 'Cliente activo' : 'Cliente inactivo'}
          </span>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">
            {tenant.name}
          </h2>
          <p className="mt-1 break-all font-mono text-xs text-slate-500">
            {tenant.code}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onEdit}>
          <Pencil /> Editar
        </Button>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-2">
        <Usage label="Sitios" value={tenant.siteCount} />
        <Usage label="Activos" value={tenant.assetCount} />
        <Usage label="Trabajos" value={tenant.workCount} />
      </dl>

      <div className="mt-6 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
        <p>
          Creado el{' '}
          {new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(
            new Date(tenant.createdAt)
          )}
        </p>
        <p className="mt-1">
          ID: <span className="break-all font-mono">{tenant.id}</span>
        </p>
      </div>

      {!tenant.active ? (
        <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Este cliente no aparece en los selectores operativos. Reactívalo desde
          Editar para recuperar el acceso a sus datos.
        </p>
      ) : null}
    </section>
  );
}

function Usage({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-center">
      <dd className="text-lg font-semibold text-slate-950">{value}</dd>
      <dt className="text-xs text-slate-500">{label}</dt>
    </div>
  );
}
