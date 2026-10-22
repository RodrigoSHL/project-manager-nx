import { Cloud, CloudOff, Loader2, ServerOff } from 'lucide-react';

export const connectivityAppearances = {
  offline: {
    Icon: CloudOff,
    className:
      'bg-amber-50 text-amber-900 border-amber-200 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:border-amber-300/20 dark:ring-amber-300/25',
  },
  online: {
    Icon: Cloud,
    className:
      'bg-emerald-50 text-emerald-900 border-emerald-200 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-200 dark:border-emerald-300/20 dark:ring-emerald-300/25',
  },
  checking: {
    Icon: Loader2,
    className:
      'bg-slate-50 text-slate-600 border-slate-200 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:ring-slate-700',
  },
  unavailable: {
    Icon: ServerOff,
    className:
      'bg-red-50 text-red-900 border-red-200 ring-red-200 dark:bg-red-400/10 dark:text-red-200 dark:border-red-300/20 dark:ring-red-300/25',
  },
};
