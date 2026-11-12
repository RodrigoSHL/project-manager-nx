import { ChevronRight, LogOut, Menu, UserRound } from 'lucide-react';
import { CurrentUser } from '../features/auth/auth-session';
import {
  getWorkspaceNavigationPath,
  WorkspaceSection,
  userInitials,
} from './workspace-navigation';

export function Header({
  section,
  user,
  sidebarOpen,
  onOpenSidebar,
  onOpenProfile,
  onLogout,
}: {
  section: WorkspaceSection;
  user: CurrentUser;
  sidebarOpen: boolean;
  onOpenSidebar: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}) {
  const path = getWorkspaceNavigationPath(section);
  const moduleLabel = path?.groups[0]?.label;
  return (
    <header className="sticky top-0 z-30 flex h-16 sm:h-20 items-center justify-between gap-3 border-b border-slate-800/70 bg-[#090d16]/95 px-3 backdrop-blur-xl sm:px-7">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Abrir menú de navegación"
          aria-controls="workspace-sidebar"
          aria-expanded={sidebarOpen}
          onClick={onOpenSidebar}
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-400 lg:hidden"
        >
          <Menu className="size-5" />
        </button>
        <div className="flex min-w-0 items-center gap-2 text-sm">
          {moduleLabel && (
            <>
              <span className="hidden text-slate-400 sm:inline">
                {moduleLabel}
              </span>
              <ChevronRight
                className="hidden size-3.5 shrink-0 text-slate-600 sm:block"
                aria-hidden="true"
              />
            </>
          )}
          <p className="truncate font-semibold text-slate-200">
            {path?.item.label}
          </p>
        </div>
      </div>
      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={onOpenProfile}
          aria-label={`Ver perfil de ${user.name}`}
          title="Ver mi perfil"
          className="flex min-w-0 items-center gap-3 rounded-xl p-1.5 text-left transition hover:bg-slate-800/60 focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <span
            className="grid size-10 shrink-0 place-items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 text-sm font-bold text-emerald-300"
            aria-hidden="true"
          >
            {userInitials(user.name)}
          </span>
          <span className="hidden min-[380px]:block max-w-24 min-w-0 sm:max-w-44">
            <span className="block truncate text-sm font-semibold text-slate-100">
              {user.name}
            </span>
            <span className="mt-0.5 hidden truncate text-[11px] sm:block text-slate-500">
              {user.email}
            </span>
          </span>
          <UserRound
            className="hidden size-4 text-slate-500 md:block"
            aria-hidden="true"
          />
        </button>
        <span className="h-7 w-px bg-slate-800" aria-hidden="true" />
        <button
          type="button"
          onClick={onLogout}
          aria-label="Cerrar sesión"
          title={`Cerrar sesión de ${user.name}`}
          className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-rose-400/10 hover:text-rose-300 focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          <LogOut className="size-[18px]" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
