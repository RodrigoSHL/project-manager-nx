import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Database,
  RefreshCw,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { MobileNavigation } from '../components/mobile-navigation';
import { GridAssetsLogo } from '../components/gridassets-logo';
import { ThemeToggle } from '../components/theme-toggle';
import { useAuth } from '../features/auth/auth-context';
import { isGlobalAdmin } from '../features/auth/auth-storage';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '../components/ui/sheet';
import { useTenantAccess } from '../features/tenants/tenant-access-context';
import { ConnectivityStatus } from '../features/offline/components/connectivity-status';
import { useOffline } from '../features/offline/offline-context';
import {
  DataSourceStatus,
  LocalDataBanner,
} from '../features/offline/components/data-source-status';

type NavigationItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  developmentOnly?: boolean;
};

const navigation: NavigationItem[] = [
  { to: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { to: '/assets', label: 'Activos', icon: Building2 },
  { to: '/works', label: 'Trabajos', icon: ClipboardList },
  { to: '/findings', label: 'Hallazgos', icon: AlertTriangle },
  { to: '/sync', label: 'Sincronización', icon: RefreshCw },
  {
    to: '/offline-debug',
    label: 'Datos locales',
    icon: Database,
    developmentOnly: true,
  },
  { to: '/admin', label: 'Administración', icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const auth = useAuth();
  const tenantAccess = useTenantAccess();
  const { mode } = useOffline();
  return (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <GridAssetsLogo className="size-9 shrink-0" />
        <div>
          <p className="font-semibold text-white">GridAssets</p>
          <p className="text-xs text-slate-400">Gestión de subestaciones</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Principal">
        {navigation
          .filter(({ to, developmentOnly }) => {
            if (developmentOnly && !import.meta.env.DEV) return false;
            return to !== '/admin' || tenantAccess.canAdministerTenants;
          })
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-amber-400/10 font-medium text-amber-300 ring-1 ring-inset ring-amber-300/25'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon className="size-5" />
              {label}
            </NavLink>
          ))}

        {isGlobalAdmin(auth.user) && mode === 'REMOTE' ? (
          <>
            <p className="mt-5 border-t border-white/10 px-3 pt-4 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Control global
            </p>
            <NavLink
              to="/platform/tenants"
              onClick={onNavigate}
              className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              <ShieldCheck className="size-5" />
              Administrar clientes
            </NavLink>
          </>
        ) : null}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 px-3 py-2">
          <p className="truncate text-sm font-medium text-white">
            {auth.user?.name}
          </p>
          <p className="truncate text-xs text-slate-400">{auth.user?.email}</p>
        </div>
        <button
          type="button"
          onClick={auth.logout}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="size-5" />
          Cerrar sesión
        </button>
      </div>
    </>
  );
}

export function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  useEffect(() => {
    const desktop = window.matchMedia?.('(min-width: 768px)');
    if (!desktop) return;
    const closeOnDesktop = () => {
      if (desktop.matches) setIsMenuOpen(false);
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-slate-950 md:flex">
        <SidebarContent />
      </aside>

      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left" className="w-72 bg-slate-950 p-0">
          <SheetTitle className="sr-only">Menú principal</SheetTitle>
          <SheetDescription className="sr-only">
            Navegación entre las secciones de la aplicación
          </SheetDescription>
          <div className="flex h-full min-h-0 flex-col overflow-y-auto">
            <SidebarContent onNavigate={() => setIsMenuOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="md:pl-64">
        <div className="sticky top-0 z-20 bg-white dark:bg-slate-900">
          <header className="flex min-h-14 min-w-0 items-center gap-1.5 border-b border-slate-200 px-3 py-1.5 md:min-h-16 md:gap-3 md:px-6 xl:px-8 dark:border-slate-800">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                <span className="xl:hidden">GridAssets</span>
                <span className="hidden xl:inline">
                  Gestión de subestaciones
                </span>
              </p>
              <p className="hidden text-xs text-slate-500 xl:block dark:text-slate-400">
                Inspecciones y activos
              </p>
            </div>
            <div className="flex min-w-0 shrink-0 items-center gap-1.5 md:gap-2">
              <DataSourceStatus />
              <ConnectivityStatus compact />
            </div>
            <ThemeToggle />
          </header>
          <LocalDataBanner />
        </div>

        <main className="mx-auto w-full min-w-0 max-w-7xl p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:p-8">
          <Outlet />
        </main>
      </div>
      <MobileNavigation open={isMenuOpen} onMore={() => setIsMenuOpen(true)} />
    </div>
  );
}
