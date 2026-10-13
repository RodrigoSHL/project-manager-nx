import type { LucideIcon } from 'lucide-react';

const tones = {
  slate: 'bg-slate-100 text-slate-600',
  blue: 'bg-blue-50 text-blue-700',
  teal: 'bg-teal-50 text-teal-700',
  amber: 'bg-amber-50 text-amber-700',
  violet: 'bg-violet-50 text-violet-700',
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
