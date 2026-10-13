import { Building2, ClipboardList, LayoutDashboard, Menu } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

const items = [
  { to: '/dashboard', label: 'Resumen', Icon: LayoutDashboard },
  { to: '/works', label: 'Trabajos', Icon: ClipboardList },
  { to: '/assets', label: 'Activos', Icon: Building2 },
];

export function MobileNavigation({
  open,
  onMore,
}: {
  open: boolean;
  onMore: () => void;
}) {
  const { pathname } = useLocation();
  const moreActive = !items.some(
    ({ to }) => pathname === to || pathname.startsWith(`${to}/`)
  );
  const itemClass =
    'flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400';

  return (
    <nav
      aria-label="Navegación móvil"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 gap-1 border-t border-slate-200 bg-white px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
    >
      {items.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `${itemClass} ${
              isActive ? 'bg-slate-100 text-slate-950' : 'text-slate-500'
            }`
          }
        >
          <Icon className="size-5" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
      <button
        type="button"
        aria-label="Más opciones"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={onMore}
        className={`${itemClass} ${
          moreActive || open ? 'bg-slate-100 text-slate-950' : 'text-slate-500'
        }`}
      >
        <Menu className="size-5" aria-hidden="true" />
        Más
      </button>
    </nav>
  );
}
