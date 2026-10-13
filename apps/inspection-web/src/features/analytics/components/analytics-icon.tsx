import type { LucideIcon } from 'lucide-react';

export function AnalyticsIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span
      className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 md:size-10"
      aria-hidden="true"
    >
      <Icon className="size-[18px] md:size-5" strokeWidth={1.8} />
    </span>
  );
}
