import type { WorkStatus } from './models';

export const workStatusLabels: Record<WorkStatus, string> = {
  DRAFT: 'Borrador',
  IN_PROGRESS: 'En progreso',
  FINISHED: 'Finalizado',
  REVIEWED: 'Revisado',
};

export const workStatusClasses: Record<WorkStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  FINISHED: 'bg-emerald-100 text-emerald-800',
  REVIEWED: 'bg-blue-100 text-blue-800',
};

export function formatWorkDate(value: string) {
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(
    new Date(`${value}T12:00:00`)
  );
}
