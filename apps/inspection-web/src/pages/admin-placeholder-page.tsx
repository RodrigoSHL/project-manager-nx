import type { LucideIcon } from 'lucide-react';
import { Construction } from 'lucide-react';

type AdminPlaceholderPageProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function AdminPlaceholderPage({
  title,
  description,
  icon: Icon,
}: AdminPlaceholderPageProps) {
  return (
    <section>
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-lg bg-slate-950 text-white">
          <Icon className="size-5" />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <Construction className="mx-auto size-8 text-slate-400" />
        <h3 className="mt-4 font-semibold text-slate-900">Sección preparada</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          La navegación y el espacio visual ya están disponibles. La lógica de
          este mantenedor se implementará en una próxima iteración.
        </p>
      </div>
    </section>
  );
}
