import { useState, type FormEvent } from 'react';
import { ArrowLeft, ShieldCheck, Zap } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { usePlatformAuth } from '../features/platform/platform-auth-context';

export function PlatformLoginPage() {
  const auth = usePlatformAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (auth.isAuthenticated) {
    return <Navigate to="/platform/tenants" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await auth.login(email, password);
      navigate('/platform/tenants', { replace: true });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No fue posible iniciar la sesión administrativa.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-amber-400 text-slate-950">
              <Zap className="size-6" fill="currentColor" />
            </span>
            <div>
              <p className="text-xl font-semibold text-slate-950">GridAssets</p>
              <p className="text-xs text-slate-500">Control de plataforma</p>
            </div>
          </div>
          <ShieldCheck className="size-7 text-slate-400" />
        </div>

        <h1 className="mt-8 text-2xl font-semibold tracking-tight text-slate-950">
          Acceso administrativo
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Ingresa con una cuenta global que tenga el rol administrador.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Correo
            <input
              required
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Contraseña
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Validando...' : 'Ingresar a plataforma'}
          </Button>
        </form>

        <Button asChild variant="ghost" className="mt-4 w-full">
          <Link to="/login">
            <ArrowLeft /> Volver a la aplicación
          </Link>
        </Button>
      </section>
    </main>
  );
}
