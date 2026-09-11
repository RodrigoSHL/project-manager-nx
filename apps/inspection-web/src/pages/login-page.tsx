import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Loader2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';
import {
  canAccessOperation,
  isGlobalAdmin,
} from '../features/auth/auth-storage';
import type { CurrentUser } from '../features/auth/models';

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirect(searchParams.get('redirect'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get('reason') === 'forbidden'
      ? 'Tu cuenta no tiene permisos para ingresar a GridAssets.'
      : null
  );

  if (auth.status === 'authenticated') {
    return <Navigate to={destinationFor(auth.user, redirectTo)} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await auth.login(email, password);
      if (!canAccessOperation(user)) {
        auth.logout();
        setError('Tu cuenta no tiene permisos para ingresar a GridAssets.');
        return;
      }
      navigate(destinationFor(user, redirectTo), { replace: true });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No fue posible iniciar sesión.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 p-3 sm:p-6">
      <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 size-96 rounded-full bg-sky-300/20 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white/95 shadow-2xl shadow-slate-950/10 backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden min-h-[650px] overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-20 -top-20 size-72 rounded-full border-[48px] border-white/[0.05]" />
          <div className="absolute bottom-20 left-8 size-52 rounded-full bg-amber-300/10 blur-3xl" />

          <div className="relative flex items-center gap-2.5 text-sm font-semibold">
            <span className="grid size-9 place-items-center rounded-xl bg-amber-400 text-slate-950">
              <Zap className="size-4" fill="currentColor" />
            </span>
            GridAssets
          </div>

          <div className="relative max-w-md">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold">
              <ShieldCheck className="size-3.5" />
              Acceso seguro para tu operación
            </span>
            <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-tight">
              Tus subestaciones y activos en una vista clara.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-slate-300">
              Gestiona la estructura técnica de cada faena y mantén cada
              operación separada por empresa.
            </p>

            <div className="mt-9 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Building2 className="mb-3 size-5 text-amber-300" />
                <p className="text-sm font-semibold">Activos organizados</p>
                <p className="mt-1 text-xs text-slate-400">
                  Empresa, faena y árbol técnico.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <ClipboardCheck className="mb-3 size-5 text-sky-300" />
                <p className="text-sm font-semibold">Trabajo controlado</p>
                <p className="mt-1 text-xs text-slate-400">
                  Configuración y ejecución trazable.
                </p>
              </div>
            </div>
          </div>

          <p className="relative text-xs text-white/40">
            GridAssets · Gestión de subestaciones
          </p>
        </aside>

        <section className="flex min-h-[600px] flex-col justify-center px-6 py-10 sm:px-12 lg:px-14">
          <div className="mb-8 flex flex-col items-start gap-2">
            <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-slate-950 text-amber-400 shadow-lg lg:hidden">
              <Zap className="size-5" fill="currentColor" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">
              Bienvenido de vuelta
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">
              Inicia sesión
            </h2>
            <p className="text-sm leading-relaxed text-slate-500">
              Usa una cuenta habilitada para GridAssets.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@empresa.com"
                className="h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-sm shadow-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-xl border border-slate-300 bg-white px-3.5 text-sm shadow-sm outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-200"
              />
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowRight className="size-4" />
              )}
              {isSubmitting ? 'Validando…' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">
            Los clientes disponibles dependen de los accesos asignados a tu
            cuenta.
          </p>
        </section>
      </div>
    </main>
  );
}

function safeRedirect(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//')
    ? value
    : '/dashboard';
}

function destinationFor(user: CurrentUser | null, redirectTo: string) {
  return redirectTo.startsWith('/platform') && !isGlobalAdmin(user)
    ? '/dashboard'
    : redirectTo;
}
