import {
  ArrowRight,
  Calculator,
  ClipboardCheck,
  Package,
  Settings,
  Smartphone,
  UserRound,
} from 'lucide-react';
import { CurrentUser } from '../features/auth/auth-session';
import { MacroGoals, UserProfile } from '../types/nutrition';
import { ACTIVITY_LABELS, GOAL_ADJUSTMENTS } from '../utils/calculator';
import { userInitials, WorkspaceSection } from './workspace-navigation';

export function ProfileView({
  user,
  profile,
  goals,
  onEdit,
}: {
  user: CurrentUser;
  profile: UserProfile | null;
  goals: MacroGoals | null;
  onEdit: () => void;
}) {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mi perfil</h2>
        <p className="mt-2 text-sm text-slate-400">
          Tu cuenta y los datos que utilizas para organizar tu alimentación.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl border border-emerald-400/25 bg-emerald-400/10 text-xl font-bold text-emerald-300">
          {userInitials(user.name)}
        </span>
        <div className="min-w-0">
          <p className="break-words text-lg font-bold">{user.name}</p>
          <p className="break-all text-sm text-slate-400">{user.email}</p>
          <p className="mt-2 text-xs text-slate-500">Cuenta de la plataforma</p>
        </div>
      </div>
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-semibold">Perfil nutricional</h3>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 rounded-xl bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-400/20"
          >
            {profile ? 'Editar datos y metas' : 'Completar mi perfil'}
            <ArrowRight className="size-4" />
          </button>
        </div>
        {profile ? (
          <>
            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ['Nombre del perfil', profile.name],
                ['Edad', `${profile.age} años`],
                ['Peso', `${profile.weightKg} kg`],
                ['Altura', `${profile.heightCm} cm`],
                [
                  'Actividad física',
                  ACTIVITY_LABELS[profile.activityLevel].label,
                ],
                ['Objetivo', GOAL_ADJUSTMENTS[profile.goal].label],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-950/60 p-4">
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="mt-2 break-words text-sm font-medium text-slate-200">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            {goals && (
              <div className="mt-5 rounded-xl border border-slate-800 p-4">
                <p className="text-xs text-slate-500">Metas actuales</p>
                <p className="mt-2 text-sm leading-7 text-slate-200">
                  {goals.calories} kcal · Proteínas {goals.proteinGrams} g ·
                  Carbohidratos {goals.carbsGrams} g · Grasas {goals.fatGrams} g
                </p>
              </div>
            )}
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Los cambios en datos y objetivos se calculan y confirman desde la
              calculadora.
            </p>
          </>
        ) : (
          <p className="mt-4 text-sm text-slate-400">
            Completa tus datos para calcular y guardar tus metas diarias.
          </p>
        )}
      </section>
    </section>
  );
}

export function SettingsView({
  onNavigate,
  canInstall,
  isStandalone,
  onInstall,
}: {
  onNavigate: (section: WorkspaceSection) => void;
  canInstall: boolean;
  isStandalone: boolean;
  onInstall: () => void;
}) {
  const entries = [
    {
      section: 'profile',
      title: 'Datos de mi perfil',
      description: 'Consulta tu cuenta, datos personales y objetivos actuales.',
      icon: UserRound,
    },
    {
      section: 'calculator',
      title: 'Metas y macronutrientes',
      description: 'Ajusta tus datos y calcula tus objetivos diarios.',
      icon: Calculator,
    },
    {
      section: 'plan',
      title: 'Pauta y equivalencias',
      description: 'Configura porciones, equivalencias y objetivo de agua.',
      icon: ClipboardCheck,
    },
    {
      section: 'products',
      title: 'Catálogo personal',
      description: 'Administra los productos que consumes habitualmente.',
      icon: Package,
    },
  ] satisfies Array<{
    section: WorkspaceSection;
    title: string;
    description: string;
    icon: typeof Settings;
  }>;
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuración</h2>
        <p className="mt-2 text-sm text-slate-400">
          Personaliza tu seguimiento y administra tu espacio.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {entries.map(({ section, title, description, icon: Icon }) => (
          <button
            key={section}
            onClick={() => onNavigate(section)}
            className="group flex items-start gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left transition hover:border-emerald-400/30 hover:bg-slate-900/80"
          >
            <span className="rounded-xl bg-emerald-400/10 p-3 text-emerald-300">
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{title}</span>
              <span className="mt-2 block text-sm leading-6 text-slate-400">
                {description}
              </span>
            </span>
            <ArrowRight className="mt-1 size-4 shrink-0 text-slate-500 group-hover:text-emerald-300" />
          </button>
        ))}
      </div>
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-start gap-4">
          <Smartphone className="mt-1 size-5 shrink-0 text-emerald-300" />
          <div>
            <h3 className="font-semibold">MacroFit en tu dispositivo</h3>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-400">
              {isStandalone
                ? 'Estás usando la aplicación instalada.'
                : canInstall
                ? 'Instala MacroFit para abrir tu diario desde la pantalla de inicio.'
                : 'Puedes consultar las opciones de instalación de tu navegador en un dispositivo compatible.'}
            </p>
          </div>
        </div>
        {canInstall && (
          <button
            onClick={onInstall}
            className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            Instalar aplicación
          </button>
        )}
      </section>
    </section>
  );
}
