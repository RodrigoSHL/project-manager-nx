import type { LucideIcon } from 'lucide-react';

const tones = {
  slate: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
  teal: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300',
  amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  violet: 'bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300',
};

export type AnalyticsIconTone = keyof typeof tones;

export function AnalyticsIcon({
  icon: Icon,
  tone = 'slate',
}: {
  icon: LucideIcon;
  tone?: AnalyticsIconTone;
}) {
  return (
    <span
      className={`grid size-9 shrink-0 place-items-center rounded-xl md:size-10 ${tones[tone]}`}
      aria-hidden="true"
    >
      <Icon className="size-[18px] md:size-5" strokeWidth={1.8} />
    </span>
  );
}
