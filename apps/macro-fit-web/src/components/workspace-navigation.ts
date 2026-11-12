import {
  BookOpen,
  Calculator,
  Compass,
  ClipboardCheck,
  Dumbbell,
  ListChecks,
  Package,
  Salad,
  Utensils,
  Settings,
  UserRound,
  ChartNoAxesCombined,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type WorkspaceSection =
  | 'dashboard'
  | 'tracker'
  | 'food-guide'
  | 'calculator'
  | 'plan'
  | 'products'
  | 'combos'
  | 'strength'
  | 'profile'
  | 'settings';

export type WorkspaceNavigationItem = {
  id: WorkspaceSection;
  label: string;
  icon: LucideIcon;
};

export type WorkspaceNavigationGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  children: readonly WorkspaceNavigationEntry[];
};

export type WorkspaceNavigationEntry =
  | WorkspaceNavigationItem
  | WorkspaceNavigationGroup;

export const WORKSPACE_NAVIGATION: readonly WorkspaceNavigationEntry[] = [
  {
    id: 'nutrition',
    label: 'Nutrición',
    icon: Salad,
    children: [
      {
        id: 'tracking',
        label: 'Seguimiento',
        icon: ChartNoAxesCombined,
        children: [
          { id: 'tracker', label: 'Diario', icon: BookOpen },
          {
            id: 'dashboard',
            label: 'Mi seguimiento',
            icon: ChartNoAxesCombined,
          },
          { id: 'food-guide', label: 'Qué puedo comer', icon: Compass },
        ],
      },
      {
        id: 'planning',
        label: 'Planificación',
        icon: ListChecks,
        children: [
          { id: 'plan', label: 'Mi pauta', icon: ClipboardCheck },
          { id: 'products', label: 'Mis productos', icon: Package },
          { id: 'combos', label: 'Mis combos', icon: Utensils },
          { id: 'calculator', label: 'Calculadora', icon: Calculator },
        ],
      },
    ],
  },
  {
    id: 'training',
    label: 'Entrenamiento',
    icon: Dumbbell,
    children: [{ id: 'strength', label: 'Muscle Log', icon: Dumbbell }],
  },
  {
    id: 'account',
    label: 'Mi cuenta',
    icon: UserRound,
    children: [
      { id: 'profile', label: 'Mi perfil', icon: UserRound },
      { id: 'settings', label: 'Configuración', icon: Settings },
    ],
  },
];

type WorkspaceNavigationPath = {
  groups: WorkspaceNavigationGroup[];
  item: WorkspaceNavigationItem;
};

export function getWorkspaceNavigationPath(
  section: WorkspaceSection,
  entries = WORKSPACE_NAVIGATION
): WorkspaceNavigationPath | undefined {
  for (const entry of entries) {
    if ('children' in entry) {
      const path = getWorkspaceNavigationPath(section, entry.children);
      if (path) return { ...path, groups: [entry, ...path.groups] };
    } else if (entry.id === section) {
      return { groups: [], item: entry };
    }
  }
}

export function userInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toLocaleUpperCase('es') || 'M'
  );
}
