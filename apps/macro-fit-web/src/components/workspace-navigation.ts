import {
  BookOpen,
  Calculator,
  Compass,
  ClipboardCheck,
  Package,
  Settings,
  UserRound,
} from 'lucide-react';

export type WorkspaceSection =
  | 'tracker'
  | 'food-guide'
  | 'calculator'
  | 'plan'
  | 'products'
  | 'profile'
  | 'settings';
export const WORKSPACE_NAVIGATION: Array<{
  label: string;
  items: Array<{ id: WorkspaceSection; label: string; icon: typeof BookOpen }>;
}> = [
  {
    label: 'Seguimiento',
    items: [
      { id: 'tracker', label: 'Diario', icon: BookOpen },
      { id: 'food-guide', label: 'Qué puedo comer', icon: Compass },
      { id: 'products', label: 'Mis productos', icon: Package },
      { id: 'plan', label: 'Mi pauta', icon: ClipboardCheck },
      { id: 'calculator', label: 'Calculadora', icon: Calculator },
    ],
  },
  {
    label: 'Mi cuenta',
    items: [
      { id: 'profile', label: 'Mi perfil', icon: UserRound },
      { id: 'settings', label: 'Configuración', icon: Settings },
    ],
  },
];

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
