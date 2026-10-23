import { FormEvent, useState } from 'react';
import {
  ArrowRight,
  LoaderCircle,
  Mic,
  ShieldCheck,
  Utensils,
} from 'lucide-react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { safeRedirect } from '@project-manager/security-navigation';
import { useAuth } from '../features/auth/auth-context';

export function LoginPage() {
  const auth = useAuth();
  const [params] = useSearchParams();
  const destination = safeRedirect(
    params.get('redirect'),
    window.location.origin,
    '/'
  );
  const redirect =
    destination.split(/[?#]/)[0].replace(/\/$/, '') === '/login'
      ? '/'
      : destination;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (auth.status === 'authenticated')
    return <Navigate to={redirect} replace />;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await auth.login(email, password);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No fue posible iniciar sesión.'
      );
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#090d16] p-3 sm:p-6 text-slate-100">
      <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 size-96 rounded-full bg-teal-400/10 blur-3xl" />
      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900/95 shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden min-h-[650px] overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-20 -top-20 size-72 rounded-full border-[48px] border-white/5" />
          <div className="relative flex items-center gap-2.5 font-semibold">
            <img src="/macrofit-icon.svg" alt="" className="size-10" />
            MacroFit
          </div>
          <div className="relative max-w-md">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold">
              <ShieldCheck className="size-3.5 text-emerald-300" />
              Tu cuenta, tu seguimiento
            </span>
            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight">
              Tu alimentación, con una vista clara de cada día.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-slate-300">
              Organiza tus comidas, revisa tus macronutrientes y registra tus
              avances a tu ritmo.
            </p>
            <div className="mt-9 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Utensils className="mb-3 size-5 text-emerald-300" />
                <p className="text-sm font-semibold">Diario personal</p>
                <p className="mt-1 text-xs text-slate-300">
                  Comidas, metas e hidratación.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Mic className="mb-3 size-5 text-teal-300" />
                <p className="text-sm font-semibold">Registra a tu manera</p>
                <p className="mt-1 text-xs text-slate-300">
                  Foto, texto o dictado.
                </p>
              </div>
            </div>
          </div>
          <p className="relative text-xs text-slate-400">
            MacroFit · Calculadora y diario de macros
          </p>
        </aside>
        <section className="flex min-h-[600px] min-w-0 flex-col justify-center px-6 py-10 sm:px-12 lg:px-14">
          <div className="mb-8 flex flex-col items-start gap-2">
            <div className="mb-3 flex items-center gap-2.5 lg:hidden">
              <img src="/macrofit-icon.svg" alt="" className="size-10" />
              <span className="font-semibold">MacroFit</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
              Bienvenido de vuelta
            </p>
            <h2 className="text-3xl font-bold tracking-tight">Inicia sesión</h2>
            <p className="text-sm leading-relaxed text-slate-400">
              Usa tu cuenta de la plataforma para entrar a MacroFit.
            </p>
          </div>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@correo.com"
                className="h-11 min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-3.5 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15"
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
                className="h-11 min-w-0 rounded-xl border border-slate-700 bg-slate-950 px-3.5 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15"
              />
            </div>
            {(error || auth.error) && (
              <p
                role="alert"
                className="rounded-lg border border-rose-500/30 bg-rose-950/40 p-3 text-sm text-rose-300"
              >
                {error || auth.error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting || auth.status === 'checking'}
              className="mt-2 flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-400 text-sm font-semibold text-slate-950 shadow-lg hover:bg-emerald-300 disabled:opacity-60"
            >
              {submitting || auth.status === 'checking' ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <ArrowRight className="size-4" />
              )}
              {submitting || auth.status === 'checking'
                ? 'Validando…'
                : 'Iniciar sesión'}
            </button>
          </form>
          <p className="mt-6 text-center text-xs leading-relaxed text-slate-400">
            Tus registros se guardan en este navegador, separados por cuenta.
          </p>
        </section>
      </div>
    </main>
  );
}
