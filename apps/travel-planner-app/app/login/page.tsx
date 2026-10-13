'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { safeRedirect } from '@project-manager/security-navigation';
import {
  ArrowRight,
  CalendarDays,
  Loader2,
  Plane,
  Sparkles,
} from 'lucide-react';
import { TravelPlannerLogo } from '@/components/brand-logo';
import { ThemeToggle } from '@/components/theme-toggle';

const BFF_URL = process.env.NEXT_PUBLIC_BFF_URL ?? '';

type Mode = 'login' | 'register';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirect(searchParams.get('redirect'), typeof window === 'undefined' ? 'http://localhost' : window.location.origin);

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint =
      mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body =
      mode === 'login' ? { email, password } : { email, password, name };

    try {
      const res = await fetch(`${BFF_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Credenciales incorrectas');
        return;
      }

      const data = await res.json();

      // Si es register, hacemos login automático para obtener el token
      if (mode === 'register') {
        const loginRes = await fetch(`${BFF_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          if (loginData.access_token) {
            localStorage.setItem('access_token', loginData.access_token);
          }
        }
      } else if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted/30 p-3 sm:p-6">
      <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 size-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-[32px] border bg-background/90 shadow-2xl shadow-foreground/10 backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden min-h-[680px] overflow-hidden brand-banner p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-20 -top-20 size-72 rounded-full border-[48px] border-white/[0.07]" />
          <div className="absolute bottom-28 left-8 size-52 rounded-full bg-cyan-300/15 blur-3xl" />

          <div className="relative flex items-center gap-2.5 text-sm font-semibold">
            <TravelPlannerLogo className="size-9 shrink-0" />
            Travel Planner
          </div>

          <div className="relative max-w-md">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              <Sparkles className="size-3.5" />
              Planifica. Comparte. Viaja.
            </span>
            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-balance">
              Tu próxima aventura, perfectamente organizada.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-sky-100">
              Construye itinerarios, coordina cada detalle y planifica junto a
              las personas que viajarán contigo.
            </p>

            <div className="mt-9 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <CalendarDays className="mb-3 size-5 text-cyan-200" />
                <p className="text-sm font-semibold">Todo en un calendario</p>
                <p className="mt-1 text-xs text-sky-100">
                  Reservas, vuelos y actividades.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <Plane className="mb-3 size-5 text-sky-200" />
                <p className="text-sm font-semibold">Viajes colaborativos</p>
                <p className="mt-1 text-xs text-sky-100">
                  Todos siempre coordinados.
                </p>
              </div>
            </div>
          </div>

          <p className="relative text-xs text-slate-300">
            Diseñado para disfrutar desde antes de partir.
          </p>
        </aside>

        <section className="relative flex min-h-[620px] min-w-0 flex-col justify-center px-6 py-10 sm:px-12 lg:px-14">
          <ThemeToggle className="absolute right-4 top-4" />
          {/* Logo */}
          <div className="mb-8 flex flex-col items-start gap-2">
            <div className="mb-3 flex items-center gap-2.5 lg:hidden">
              <TravelPlannerLogo className="size-10 shrink-0 shadow-lg" />
              <span className="font-semibold">Travel Planner</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-foreground">
              {mode === 'login'
                ? 'Bienvenido de vuelta'
                : 'Comienza tu aventura'}
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {mode === 'login'
                ? 'Tus viajes te están esperando.'
                : 'Organiza tu próximo destino en minutos.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'register' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-sm font-medium text-foreground">
                  Nombre
                </label>
                <input
                  id="name"
                  autoComplete="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="h-11 min-w-0 rounded-xl border border-input bg-background px-3.5 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                autoComplete="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="h-11 min-w-0 rounded-xl border border-input bg-background px-3.5 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Contraseña
              </label>
              <input
                id="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 min-w-0 rounded-xl border border-input bg-background px-3.5 text-sm shadow-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              {!loading && <ArrowRight className="size-4" />}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
              }}
              className="text-brand-foreground font-medium hover:underline"
            >
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </section>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginForm />
    </Suspense>
  );
}
