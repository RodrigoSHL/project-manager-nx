import {
  ArrowRight,
  BookOpenText,
  Building2,
  MapPinned,
  Shapes,
  Users,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const sections = [
  {
    to: '/admin/assets',
    title: 'Activos',
    description:
      'Organiza subestaciones y equipos mediante el árbol jerárquico.',
    icon: Building2,
    status: 'Disponible',
  },
  {
    to: '/admin/asset-types',
    title: 'Tipos de activos',
    description:
      'Define las clases de equipo y los trabajos permitidos para cada una.',
    icon: Shapes,
    status: 'Disponible',
  },
  {
    to: '/admin/work-types',
    title: 'Tipos de trabajo',
    description:
      'Crea y administra las clases de trabajo disponibles en cada empresa.',
    icon: Wrench,
    status: 'Disponible',
  },
  {
    to: '/admin/concepts',
    title: 'Conceptos',
    description:
      'Define variables, estados y características reutilizables por tipo de activo.',
    icon: BookOpenText,
    status: 'Disponible',
  },
  {
    to: '/admin/sites',
    title: 'Sitios y faenas',
    description: 'Administra las ubicaciones que pertenecen a cada empresa.',
    icon: MapPinned,
    status: 'Próximamente',
  },
  {
    to: '/admin/users',
    title: 'Usuarios y permisos',
    description: 'Gestiona las personas y sus accesos al sistema.',
    icon: Users,
    status: 'Próximamente',
  },
];

export function AdminOverviewPage() {
  return (
    <section>
      <h2 className="text-xl font-semibold text-slate-950">
        Centro de administración
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Selecciona la configuración que quieres administrar.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {sections.map(({ to, title, description, icon: Icon, status }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-11 place-items-center rounded-lg bg-slate-100 text-slate-700 transition-colors group-hover:bg-slate-950 group-hover:text-white">
                <Icon className="size-5" />
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  status === 'Disponible'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {status}
              </span>
            </div>
            <h3 className="mt-5 font-semibold text-slate-950">{title}</h3>
            <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">
              {description}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-800">
              Abrir sección
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
