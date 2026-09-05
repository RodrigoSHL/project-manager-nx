import { type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { Button } from '../components/ui/button';

type LoginPageProps = {
  onLogin: () => void;
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onLogin();
    navigate('/dashboard');
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 p-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-amber-400 text-slate-950">
            <Zap className="size-6" fill="currentColor" />
          </span>
          <div>
            <p className="text-xl font-semibold text-slate-950">GridAssets</p>
            <p className="text-sm text-slate-500">Gestión de subestaciones</p>
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Iniciar sesión
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Acceso simulado para revisar la navegación visual.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Correo
            <input
              type="email"
              defaultValue="demo@gridassets.cl"
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Contraseña
            <input
              type="password"
              defaultValue="demo"
              className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <Button type="submit" size="lg" className="w-full">
            Ingresar
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-400">
          Estos campos no se validan ni se guardan.
        </p>
      </section>
    </main>
  );
}
