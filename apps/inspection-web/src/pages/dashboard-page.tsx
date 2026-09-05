import {
  AlertTriangle,
  Building2,
  ClipboardCheck,
  ClipboardList,
} from 'lucide-react';
import { PageHeader } from '../components/page-header';

const cards = [
  { label: 'Subestaciones', value: '3', icon: Building2 },
  { label: 'Activos', value: '18', icon: ClipboardCheck },
  { label: 'Trabajos abiertos', value: '6', icon: ClipboardList },
  { label: 'Hallazgos pendientes', value: '4', icon: AlertTriangle },
];

export function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Resumen visual del sistema. Los valores son datos de ejemplo."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">
                  {value}
                </p>
              </div>
              <span className="grid size-10 place-items-center rounded-lg bg-slate-100 text-slate-600">
                <Icon className="size-5" />
              </span>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
