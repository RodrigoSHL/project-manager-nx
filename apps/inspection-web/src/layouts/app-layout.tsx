import { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Zap,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { Button } from '../components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '../components/ui/sheet';

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/assets', label: 'Activos', icon: Building2 },
  { to: '/works', label: 'Trabajos', icon: ClipboardList },
  { to: '/findings', label: 'Hallazgos', icon: AlertTriangle },
  { to: '/admin', label: 'Administración', icon: Settings },
];

type AppLayoutProps = {
  onLogout: () => void;
};

function SidebarContent({
  onNavigate,
  onLogout,
}: AppLayoutProps & { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <span className="grid size-9 place-items-center rounded-lg bg-amber-400 text-slate-950">
          <Zap className="size-5" fill="currentColor" />
        </span>
        <div>
          <p className="font-semibold text-white">GridAssets</p>
          <p className="text-xs text-slate-400">Gestión de subestaciones</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Principal">
        {navigation.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${
                isActive
                  ? 'bg-white/10 font-medium text-white'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-5" />
          Cerrar sesión
        </button>
      </div>
    </>
  );
}

export function AppLayout({ onLogout }: AppLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-slate-950 md:flex">
        <SidebarContent onLogout={onLogout} />
      </aside>

      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left" className="w-72 bg-slate-950 p-0">
          <SheetTitle className="sr-only">Menú principal</SheetTitle>
          <SheetDescription className="sr-only">
            Navegación entre las secciones de la aplicación
          </SheetDescription>
          <div className="flex h-full flex-col">
            <SidebarContent
              onLogout={onLogout}
              onNavigate={() => setIsMenuOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 md:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Abrir menú"
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu />
          </Button>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Gestión de subestaciones
            </p>
            <p className="text-xs text-slate-500">Etapa visual</p>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
