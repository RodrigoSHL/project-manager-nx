'use client'

import {
  Building2,
  Landmark,
  Globe,
  Rocket,
  Cloud,
  ClipboardList,
} from 'lucide-react'
import { SectionHeading } from './section-heading'
import { ServiceCard } from './service-card'

const SERVICES = [
  {
    icon: Building2,
    title: 'Desarrollo de software empresarial',
    description:
      'Construcción y modernización de aplicaciones robustas para procesos críticos, plataformas internas y servicios digitales.',
    tags: ['.NET 10', 'C#', 'ASP.NET Core', 'Blazor', 'SQL Server', 'EF Core'],
    accentColor: 'turquoise' as const,
  },
  {
    icon: Landmark,
    title: 'Soluciones para el sector público',
    description:
      'Desarrollo de plataformas orientadas a instituciones públicas, considerando seguridad, trazabilidad, mantenibilidad e integración con sistemas existentes.',
    tags: ['Seguridad', 'Trazabilidad', 'Integración', 'Accesibilidad'],
    accentColor: 'pink' as const,
  },
  {
    icon: Globe,
    title: 'Desarrollo web moderno',
    description:
      'Experiencias web rápidas, responsivas y escalables, construidas con tecnologías modernas de frontend y backend.',
    tags: ['React', 'Angular', 'Vue', 'TypeScript', 'Node.js', 'NestJS'],
    accentColor: 'turquoise' as const,
  },
  {
    icon: Rocket,
    title: 'DevOps y automatización',
    description:
      'Automatizamos la construcción, validación y entrega de software para lograr despliegues más rápidos, repetibles y confiables.',
    tags: ['CI/CD', 'GitHub Actions', 'Azure DevOps', 'Kubernetes', 'Docker', 'Helm'],
    accentColor: 'pink' as const,
  },
  {
    icon: Cloud,
    title: 'Cloud e infraestructura',
    description:
      'Diseñamos soluciones preparadas para operar en la nube, seleccionando los servicios adecuados según las necesidades técnicas y comerciales.',
    tags: ['Microsoft Azure', 'AWS', 'Google Cloud', 'Oracle Cloud'],
    accentColor: 'turquoise' as const,
  },
  {
    icon: ClipboardList,
    title: 'Levantamiento de requerimientos',
    description:
      'Convertimos necesidades, procesos y reglas de negocio en definiciones claras que permitan construir la solución correcta.',
    tags: ['Descubrimiento', 'Análisis', 'Historias de usuario', 'Diseño funcional', 'Planificación'],
    accentColor: 'pink' as const,
  },
]

export function Services() {
  return (
    <section id="servicios" className="relative py-24 lg:py-32">
      {/* Subtle left glow */}
      <div
        className="pointer-events-none absolute left-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, oklch(0.75 0.22 340) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          label="Servicios"
          title="Lo que construimos juntos."
          subtitle="Desde la definición del problema hasta el despliegue en producción, acompañamos cada etapa con las capacidades técnicas adecuadas."
          centered
          className="mb-14"
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => (
            <ServiceCard key={service.title} {...service} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
