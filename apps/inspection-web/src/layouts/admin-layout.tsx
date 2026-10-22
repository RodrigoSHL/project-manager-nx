import {
  Building2,
  BookOpenText,
  FileText,
  LayoutGrid,
  MapPinned,
  Shapes,
  Users,
  Wrench,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '../lib/utils';

const adminNavigation = [
  { to: '/admin', label: 'Resumen', icon: LayoutGrid, end: true },
  { to: '/admin/assets', label: 'Activos', icon: Building2 },
  { to: '/admin/asset-types', label: 'Tipos de activos', icon: Shapes },
  { to: '/admin/work-types', label: 'Tipos de trabajo', icon: Wrench },
  { to: '/admin/concepts', label: 'Conceptos', icon: BookOpenText },
  { to: '/admin/reports', label: 'Informes', icon: FileText },
  { to: '/admin/sites', label: 'Sitios', icon: MapPinned },
  { to: '/admin/users', label: 'Usuarios', icon: Users },
];

export function AdminLayout() {
  return (
    <>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
          Configuración
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 md:text-3xl">
          Administración
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          Gestiona la estructura, los catálogos y el acceso de cada empresa.
        </p>
      </header>

      <nav
        className="mt-6 flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-px"
        aria-label="Secciones de administración"
      >
        {adminNavigation.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'mb-[-1px] inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors',
                isActive
                  ? 'border-amber-500 text-amber-900 dark:border-amber-300 dark:text-amber-300'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-800 dark:hover:text-slate-200'
              )
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-7">
        <Outlet />
      </div>
    </>
  );
}
