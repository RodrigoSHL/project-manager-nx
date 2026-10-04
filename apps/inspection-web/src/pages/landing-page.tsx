import { useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Activity,
  BarChart3,
  Building2,
  Cable,
  Check,
  ChevronRight,
  Clock3,
  ClipboardCheck,
  Cpu,
  FileBarChart2,
  FileText,
  Layers3,
  MapPinned,
  Menu,
  ShieldCheck,
  TrendingUp,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const atomdevHref = 'https://atomdev.cl';
const contactEmail = 'contacto@atomdev.cl';
const demoHref = `mailto:${contactEmail}?subject=${encodeURIComponent(
  'Quiero conocer GridAssets'
)}`;
const quoteHref = `mailto:${contactEmail}?subject=${encodeURIComponent(
  'Cotización de GridAssets'
)}`;
const hardwareHref = `mailto:${contactEmail}?subject=${encodeURIComponent(
  'Revisión de compatibilidad de hardware para GridAssets'
)}&body=${encodeURIComponent(
  'Hola, quiero evaluar una integración con GridAssets.\n\nEquipo o sistema (marca/modelo):\nProtocolo o interfaz, si lo conozco:\nMediciones que necesito:\nFaena y conectividad disponible:\n'
)}`;

const pricingPlans = [
  {
    name: 'Una faena',
    price: '10 UF',
    description:
      'Para gestionar una faena con todas las herramientas de trabajo en terreno.',
    scope: '1 faena',
    features: [
      'Árbol de activos y pautas configurables',
      'Ejecución sin conexión y sincronización',
      'Hallazgos, informes y analítica',
      'Puesta en marcha autogestionada',
    ],
    highlighted: false,
  },
  {
    name: 'Multifaena',
    price: '15 UF',
    description:
      'Para coordinar varias faenas con acompañamiento desde el primer día.',
    scope: 'Hasta 3 faenas',
    features: [
      'Todas las capacidades de Una faena',
      'Análisis por faena desde un mismo panel',
      'Configuración guiada de la primera pauta',
      '2 sesiones remotas de arranque de 60 minutos',
      'Revisión mensual de indicadores de 30 minutos',
    ],
    highlighted: true,
  },
  {
    name: 'Corporativo',
    price: 'A medida',
    description:
      'Para despliegues más amplios, con requisitos de adopción y soporte propios.',
    scope: 'Más de 3 faenas',
    features: [
      'Alcance y volumen definidos en conjunto',
      'Puesta en marcha por etapas',
      'Condiciones de soporte acordadas',
    ],
    highlighted: false,
  },
] as const;

const capabilities = [
  {
    icon: Building2,
    eyebrow: '01 / ESTRUCTURA',
    title: 'Cada activo en su lugar.',
    description:
      'Organiza empresas, faenas, subestaciones y componentes en un árbol que refleja tu operación real.',
    accent: 'bg-sky-50 text-sky-700',
  },
  {
    icon: ClipboardCheck,
    eyebrow: '02 / EJECUCIÓN',
    title: 'Pautas que viajan al terreno.',
    description:
      'Configura formularios por tipo de trabajo y registra tareas, mediciones, comentarios y fotografías.',
    accent: 'bg-amber-50 text-amber-700',
  },
  {
    icon: WifiOff,
    eyebrow: '03 / MOVILIDAD',
    title: 'El trabajo no se detiene sin señal.',
    description:
      'Descarga la información necesaria, continúa en modo offline y sincroniza los cambios cuando vuelve la conexión.',
    accent: 'bg-emerald-50 text-emerald-700',
  },
  {
    icon: BarChart3,
    eyebrow: '04 / VISIBILIDAD',
    title: 'Del dato a una decisión informada.',
    description:
      'Revisa hallazgos, informes y tendencias históricas de mediciones sobre cada activo.',
    accent: 'bg-violet-50 text-violet-700',
  },
];

const flow = [
  ['01', 'Configura', 'Define activos, conceptos y pautas de inspección.'],
  ['02', 'Ejecuta', 'Registra el trabajo desde el computador o el celular.'],
  [
    '03',
    'Sincroniza',
    'Conserva el avance local y envíalo al recuperar señal.',
  ],
  ['04', 'Analiza', 'Revisa hallazgos, informes e historial técnico.'],
];

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap text-xl font-extrabold tracking-tight">
      <span
        className={`grid size-9 place-items-center rounded-xl ${
          inverse
            ? 'bg-amber-400 text-slate-950'
            : 'bg-slate-950 text-amber-400'
        }`}
      >
        <Zap className="size-5" fill="currentColor" strokeWidth={2.5} />
      </span>
      GridAssets
    </span>
  );
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-xl">
        <nav
          aria-label="Navegación principal"
          className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-10"
        >
          <a href="#inicio" aria-label="GridAssets, ir al inicio">
            <Brand />
          </a>

          <div className="hidden items-center gap-8 text-sm font-semibold lg:flex">
            <a className="transition hover:text-blue-600" href="#producto">
              Producto
            </a>
            <a className="transition hover:text-blue-600" href="#como-funciona">
              Cómo funciona
            </a>
            <a className="transition hover:text-blue-600" href="#integraciones">
              Integraciones
            </a>
            <a className="transition hover:text-blue-600" href="#precios">
              Precios
            </a>
          </div>

          <div className="hidden items-center gap-5 text-sm font-semibold lg:flex">
            <Link className="transition hover:text-blue-600" to="/login">
              Ingresar
            </Link>
            <a
              href={demoHref}
              className="rounded-full bg-blue-600 px-5 py-3 text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
            >
              Solicitar demo
            </a>
          </div>

          <button
            type="button"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="grid size-11 place-items-center rounded-xl border border-slate-200 lg:hidden"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </nav>

        {menuOpen && (
          <div className="border-t border-slate-100 bg-white px-5 pb-6 pt-3 shadow-xl lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 text-sm font-semibold">
              {[
                ['Producto', '#producto'],
                ['Cómo funciona', '#como-funciona'],
                ['Integraciones', '#integraciones'],
                ['Precios', '#precios'],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-3 hover:bg-slate-50"
                >
                  {label}
                </a>
              ))}
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-3 hover:bg-slate-50"
              >
                Ingresar al sistema
              </Link>
              <a
                href={demoHref}
                className="mt-2 rounded-full bg-blue-600 px-5 py-3 text-center text-white"
              >
                Solicitar demo
              </a>
            </div>
          </div>
        )}
      </header>

      <main>
        <section id="inicio" className="scroll-mt-24 overflow-hidden">
          <div className="mx-auto max-w-7xl px-5 pb-20 pt-20 sm:px-8 lg:px-10 lg:pt-28">
            <div className="grid gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-start lg:gap-16">
              <div>
                <p className="mb-6 text-xs font-bold uppercase tracking-[0.22em] text-blue-600 sm:text-sm">
                  Plataforma de inspección y gestión de activos
                </p>
                <h1 className="max-w-3xl text-balance text-5xl font-extrabold leading-[1.06] tracking-[-0.055em] sm:text-6xl lg:text-[4.65rem]">
                  Inspecciones conectadas.{' '}
                  <span className="text-blue-600">Activos bajo control.</span>
                </h1>
              </div>
              <div className="lg:pt-10">
                <p className="max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl">
                  GridAssets conecta la estructura de tus faenas con las
                  inspecciones en terreno, los hallazgos y el historial técnico.
                  Toda la información que importa, en un mismo lugar.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <a
                    href={demoHref}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/15 transition hover:-translate-y-0.5 hover:bg-blue-700"
                  >
                    Solicitar una demostración
                    <ArrowUpRight className="size-4" />
                  </a>
                  <a
                    href="#producto"
                    className="inline-flex items-center gap-1 text-sm font-bold text-slate-700 transition hover:text-blue-600"
                  >
                    Explorar el producto <ChevronRight className="size-4" />
                  </a>
                </div>
                <p className="mt-6 text-sm text-slate-500">
                  Producto desarrollado por{' '}
                  <a
                    href={atomdevHref}
                    className="inline-flex items-center gap-1 font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
                  >
                    AtomDev
                    <ArrowUpRight aria-hidden="true" className="size-3.5" />
                  </a>
                </p>
              </div>
            </div>

            <div className="relative mt-16 overflow-hidden rounded-[1.6rem] bg-slate-900 shadow-2xl shadow-slate-950/15 sm:mt-20">
              <img
                src="/gridassets-substation-hero.jpg"
                alt="Técnico con equipo de protección inspeccionando un gabinete de una subestación eléctrica"
                className="h-[360px] w-full object-cover object-[35%_center] sm:h-[500px] lg:h-[590px]"
                fetchPriority="high"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 rounded-full border border-white/30 bg-slate-950/45 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md sm:bottom-8 sm:left-8">
                Pensado para el trabajo real en terreno
              </div>
              <div className="absolute bottom-6 right-6 hidden w-72 rounded-2xl border border-white/50 bg-white/95 p-5 shadow-2xl backdrop-blur-md lg:block">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                    <ClipboardCheck className="size-5" />
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Guardado local
                  </span>
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                  Vista ilustrativa
                </p>
                <p className="mt-1 text-base font-bold">Inspección de activo</p>
                <p className="mt-1 text-sm text-slate-500">
                  Pauta, mediciones y evidencias en el mismo trabajo.
                </p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-3/4 rounded-full bg-blue-600" />
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col justify-between gap-5 border-b border-slate-200 pb-10 text-sm text-slate-500 md:flex-row md:items-center">
              <p className="font-semibold text-slate-800">
                Una plataforma para operaciones que no caben en una planilla.
              </p>
              <div className="flex flex-wrap gap-x-7 gap-y-2 font-medium">
                <span>Minería</span>
                <span>Energía</span>
                <span>Industria</span>
                <span>Equipos en terreno</span>
              </div>
            </div>
          </div>
        </section>

        <section
          id="producto"
          className="scroll-mt-24 bg-[#f7f9fc] py-20 sm:py-28"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
                La plataforma
              </p>
              <h2 className="mt-5 text-balance text-4xl font-extrabold leading-tight tracking-[-0.045em] sm:text-5xl">
                Del árbol de activos al trabajo terminado.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-slate-600">
                La misma información acompaña a tu equipo desde la configuración
                de una pauta hasta la revisión del informe. Sin perder el
                contexto de qué activo se inspeccionó.
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {capabilities.map(
                ({ icon: Icon, eyebrow, title, description, accent }) => (
                  <article
                    key={title}
                    className="group flex min-h-[300px] flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60"
                  >
                    <span
                      className={`grid size-12 place-items-center rounded-2xl ${accent}`}
                    >
                      <Icon className="size-6" strokeWidth={1.8} />
                    </span>
                    <p className="mt-8 text-[11px] font-bold tracking-[0.18em] text-slate-400">
                      {eyebrow}
                    </p>
                    <h3 className="mt-2 text-xl font-bold tracking-tight">
                      {title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      {description}
                    </p>
                  </article>
                )
              )}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="scroll-mt-24 py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
                Cómo funciona
              </p>
              <h2 className="mt-5 text-balance text-4xl font-extrabold leading-tight tracking-[-0.045em] sm:text-5xl">
                Una secuencia clara para cada inspección.
              </h2>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">
                GridAssets conserva el vínculo entre el activo, la pauta, las
                respuestas y los hallazgos. Puedes seguir el trabajo incluso
                cuando la conectividad es intermitente.
              </p>
              <a
                href={demoHref}
                className="mt-8 inline-flex items-center gap-2 font-bold text-blue-600 hover:text-blue-700"
              >
                Conversemos sobre tu operación <ArrowRight className="size-4" />
              </a>
            </div>

            <div className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/15 sm:p-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-amber-400 text-slate-950">
                    <Zap className="size-5" fill="currentColor" />
                  </span>
                  <span className="font-bold">Un flujo conectado</span>
                </div>
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-300">
                  De principio a fin
                </span>
              </div>
              <ol className="mt-3">
                {flow.map(([number, title, description], index) => (
                  <li
                    key={number}
                    className={`grid grid-cols-[3rem_1fr] gap-4 py-5 ${
                      index < flow.length - 1 ? 'border-b border-white/10' : ''
                    }`}
                  >
                    <span className="text-sm font-bold text-amber-400">
                      {number}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold">{title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-400">
                        {description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="bg-slate-950 py-20 text-white sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-20 lg:px-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-300">
                Menos trabajo manual, más contexto
              </p>
              <h2 className="mt-5 text-balance text-4xl font-extrabold leading-tight tracking-[-0.045em] sm:text-5xl">
                Ahorra tiempo y decide con una visión más completa.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-slate-300">
                Reúne inspecciones, mediciones, hallazgos e informes. Así el
                equipo puede revisar la evolución de cada activo sin reconstruir
                su historia desde varias planillas.
              </p>
              <ul className="mt-8 space-y-4 text-sm font-medium text-slate-200 sm:text-base">
                <li className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 size-5 shrink-0 text-blue-300" />
                  Dedica menos tiempo a consolidar datos y preparar reportes.
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="mt-0.5 size-5 shrink-0 text-blue-300" />
                  Compara mediciones y observa cómo evoluciona cada activo.
                </li>
                <li className="flex items-start gap-3">
                  <FileBarChart2 className="mt-0.5 size-5 shrink-0 text-blue-300" />
                  Comparte informes con respuestas, hallazgos y evidencias.
                </li>
              </ul>
            </div>

            <div className="min-w-0 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white p-5 text-slate-950 shadow-2xl shadow-black/20 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
                      <Activity className="size-5" />
                    </span>
                    <div>
                      <p className="font-bold">Evolución de mediciones</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Temperatura · Transformador T1
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Ejemplo ilustrativo
                  </span>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-3 sm:p-5">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Historial del concepto</span>
                    <span>°C</span>
                  </div>
                  <svg
                    className="mt-3 h-48 w-full overflow-visible"
                    viewBox="0 0 560 190"
                    role="img"
                    aria-label="Gráfico ilustrativo de mediciones históricas que permite observar su variación en el tiempo"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        id="measurement-area"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#2563eb"
                          stopOpacity="0.18"
                        />
                        <stop
                          offset="100%"
                          stopColor="#2563eb"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                    {[24, 68, 112, 156].map((y) => (
                      <line
                        key={y}
                        x1="40"
                        x2="548"
                        y1={y}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray="4 6"
                      />
                    ))}
                    <text x="2" y="28" fill="#94a3b8" fontSize="11">
                      70
                    </text>
                    <text x="2" y="72" fill="#94a3b8" fontSize="11">
                      60
                    </text>
                    <text x="2" y="116" fill="#94a3b8" fontSize="11">
                      50
                    </text>
                    <text x="2" y="160" fill="#94a3b8" fontSize="11">
                      40
                    </text>
                    <path
                      d="M42 141 C88 137 94 114 146 119 S214 101 248 108 S328 84 350 91 S430 67 455 77 S518 51 546 57 L546 166 L42 166 Z"
                      fill="url(#measurement-area)"
                    />
                    <path
                      d="M42 141 C88 137 94 114 146 119 S214 101 248 108 S328 84 350 91 S430 67 455 77 S518 51 546 57"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    {[
                      [42, 141],
                      [146, 119],
                      [248, 108],
                      [350, 91],
                      [455, 77],
                      [546, 57],
                    ].map(([cx, cy]) => (
                      <circle
                        key={cx}
                        cx={cx}
                        cy={cy}
                        r="5"
                        fill="#fff"
                        stroke="#2563eb"
                        strokeWidth="3"
                      />
                    ))}
                    <text x="40" y="185" fill="#94a3b8" fontSize="11">
                      Jun
                    </text>
                    <text x="205" y="185" fill="#94a3b8" fontSize="11">
                      Jul
                    </text>
                    <text x="370" y="185" fill="#94a3b8" fontSize="11">
                      Ago
                    </text>
                    <text x="520" y="185" fill="#94a3b8" fontSize="11">
                      Sep
                    </text>
                  </svg>
                  <p className="mt-1 text-xs text-slate-500">
                    Cada punto representa una medición registrada.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300">
                    <ClipboardCheck className="size-5" />
                  </span>
                  <div>
                    <p className="font-bold">Informe de inspección</p>
                    <p className="mt-1 text-sm text-slate-300">
                      Trabajo, mediciones, hallazgos y fotografías en un mismo
                      registro.
                    </p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 sm:self-center">
                  <Check className="size-3.5" /> Trazable
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#eef4ff] py-20 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-20 lg:px-10">
            <div className="min-w-0 rounded-[2rem] border border-blue-100 bg-white p-5 shadow-xl shadow-blue-900/5 sm:p-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-slate-950 text-amber-400">
                    <Layers3 className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold">Historial técnico</p>
                    <p className="text-xs text-slate-500">Ejemplo de vista</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Asset 01
                </span>
              </div>
              <div className="space-y-3 pt-5">
                {[
                  [
                    MapPinned,
                    'Subestación › Transformador T1',
                    'Árbol de activos',
                  ],
                  [ClipboardCheck, 'Inspección visual completada', 'Trabajo'],
                  [ShieldCheck, 'Hallazgo revisado', 'Resultado'],
                  [FileText, 'Informe disponible', 'Documento'],
                ].map(([Icon, label, kind]) => {
                  const RowIcon = Icon as typeof MapPinned;
                  return (
                    <div
                      key={label as string}
                      className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-blue-600">
                        <RowIcon className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {label as string}
                        </p>
                        <p className="text-xs text-slate-500">
                          {kind as string}
                        </p>
                      </div>
                      <Check className="ml-auto size-4 shrink-0 text-emerald-600" />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
                Trazabilidad útil
              </p>
              <h2 className="mt-5 text-balance text-4xl font-extrabold leading-tight tracking-[-0.045em] sm:text-5xl">
                Respuestas con contexto, no datos sueltos.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-slate-600">
                Cada medición se puede leer junto al trabajo que la originó y
                los límites que aplicaban en ese momento. El historial permite
                comparar activos y entender cómo evoluciona una condición.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-slate-700">
                <span className="rounded-full bg-white px-4 py-2">
                  Mediciones históricas
                </span>
                <span className="rounded-full bg-white px-4 py-2">
                  Hallazgos
                </span>
                <span className="rounded-full bg-white px-4 py-2">
                  Informes
                </span>
              </div>
            </div>
          </div>
        </section>

        <section
          id="integraciones"
          className="scroll-mt-24 bg-[#f7f9fc] py-20 sm:py-28"
        >
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-20 lg:px-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
                Integración con hardware
              </p>
              <h2 className="mt-5 text-balance text-4xl font-extrabold leading-tight tracking-[-0.045em] sm:text-5xl">
                Tus equipos también pueden aportar datos.
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
                Evaluamos cómo conectar sensores, medidores o sistemas de
                control para asociar sus mediciones a los activos que ya
                gestionas en GridAssets.
              </p>
              <div className="mt-7 flex items-start gap-3 rounded-2xl border border-blue-100 bg-white p-5 text-sm leading-relaxed text-slate-600 shadow-sm">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-blue-600" />
                <p>
                  Cada integración requiere una revisión previa de
                  compatibilidad, conectividad y alcance técnico. La solución se
                  define para los equipos disponibles en tu faena.
                </p>
              </div>
              <a
                href={hardwareHref}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/15 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Revisar compatibilidad <ArrowUpRight className="size-4" />
              </a>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                De la señal al contexto
              </p>
              <div className="mt-6 space-y-3">
                {[
                  {
                    icon: Cpu,
                    title: 'Equipo en terreno',
                    detail: 'Sensor, medidor o PLC/SCADA existente.',
                    accent: 'bg-amber-50 text-amber-700',
                  },
                  {
                    icon: Cable,
                    title: 'Revisión de compatibilidad',
                    detail: 'Protocolo, señal, red y frecuencia de lectura.',
                    accent: 'bg-blue-50 text-blue-700',
                  },
                  {
                    icon: Activity,
                    title: 'Integración a medida',
                    detail: 'Mediciones vinculadas al activo correspondiente.',
                    accent: 'bg-emerald-50 text-emerald-700',
                  },
                ].map(({ icon: Icon, title, detail, accent }, index) => (
                  <div key={title}>
                    {index > 0 && (
                      <div className="ml-6 h-3 border-l-2 border-dashed border-slate-200" />
                    )}
                    <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                      <span
                        className={`grid size-12 shrink-0 place-items-center rounded-xl ${accent}`}
                      >
                        <Icon className="size-6" strokeWidth={1.8} />
                      </span>
                      <div>
                        <h3 className="font-bold text-slate-950">{title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                          {detail}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="precios" className="scroll-mt-24 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">
                Precios
              </p>
              <h2 className="mt-5 text-balance text-4xl font-extrabold leading-tight tracking-[-0.045em] sm:text-5xl">
                Empieza por una faena. Crece con tu operación.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-slate-600">
                El precio parte por el alcance de tus faenas, sin cobrar cada
                activo del árbol por separado. La ejecución sin conexión está
                incluida desde el primer plan. Los valores se expresan en UF
                mensuales, más IVA.
              </p>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-3 lg:items-stretch">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={`flex flex-col rounded-3xl p-8 ${
                    plan.highlighted
                      ? 'border-2 border-blue-600 bg-slate-950 text-white shadow-2xl shadow-blue-950/15'
                      : 'border border-slate-200 bg-white text-slate-950'
                  }`}
                >
                  {plan.highlighted && (
                    <span className="mb-5 inline-flex w-fit rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                      Recomendado
                    </span>
                  )}
                  <p
                    className={`text-sm font-bold ${
                      plan.highlighted ? 'text-blue-300' : 'text-blue-700'
                    }`}
                  >
                    {plan.scope}
                  </p>
                  <h3 className="mt-3 text-2xl font-extrabold">{plan.name}</h3>
                  <div className="mt-7 flex flex-wrap items-baseline gap-x-2">
                    {plan.price !== 'A medida' && (
                      <span className="text-sm font-semibold">Desde</span>
                    )}
                    <span className="text-4xl font-extrabold tracking-tight">
                      {plan.price}
                    </span>
                    {plan.price !== 'A medida' && (
                      <span className="text-sm">al mes + IVA</span>
                    )}
                  </div>
                  <p
                    className={`mt-5 min-h-16 text-sm leading-relaxed ${
                      plan.highlighted ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {plan.description}
                  </p>
                  <ul className="mt-7 flex-1 space-y-3 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check
                          aria-hidden="true"
                          className={`mt-0.5 size-4 shrink-0 ${
                            plan.highlighted ? 'text-blue-300' : 'text-blue-600'
                          }`}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`mailto:${contactEmail}?subject=${encodeURIComponent(
                      `Cotización GridAssets · ${plan.name}`
                    )}`}
                    className={`mt-9 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold transition ${
                      plan.highlighted
                        ? 'bg-blue-600 text-white hover:bg-blue-500'
                        : 'border border-slate-200 text-slate-950 hover:bg-slate-50'
                    }`}
                  >
                    Solicitar cotización <ArrowUpRight className="size-4" />
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl bg-slate-50 p-6 text-sm leading-relaxed text-slate-600 sm:p-7">
              <p className="font-bold text-slate-950">
                ¿Qué define el valor final?
              </p>
              <p className="mt-2">
                La propuesta precisa usuarios, volumen de datos, soporte y
                almacenamiento. La configuración adicional a las sesiones
                incluidas y la migración de información se cotizan por separado
                cuando se necesitan. La integración con hardware se evalúa y
                cotiza por separado. La mensualidad en pesos se calcula con el
                valor vigente de la UF. Antes de trabajar sin señal, descarga la
                faena en el dispositivo; al reconectarte, podrás sincronizar lo
                registrado.
              </p>
              <a
                href={quoteHref}
                className="mt-4 inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-800"
              >
                Consultar por mi operación <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </section>

        <section className="bg-blue-600 py-20 text-white sm:py-24">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-100">
                Lleva claridad al terreno
              </p>
              <h2 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-[-0.045em] sm:text-5xl">
                Hablemos de lo que tus activos necesitan.
              </h2>
            </div>
            <a
              href={demoHref}
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-white px-7 py-4 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
            >
              Solicitar demo <ArrowUpRight className="size-4" />
            </a>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 py-12 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
          <div>
            <Brand inverse />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-400">
              Inspecciones, activos e historial técnico conectados para equipos
              que trabajan en terreno.
            </p>
            <p className="mt-5 text-sm text-slate-400">
              GridAssets es un producto desarrollado por{' '}
              <a
                href={atomdevHref}
                className="inline-flex items-center gap-1 font-semibold text-slate-200 underline decoration-slate-600 underline-offset-4 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                AtomDev
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </a>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-slate-300">
            <a className="hover:text-white" href="#producto">
              Producto
            </a>
            <a className="hover:text-white" href="#integraciones">
              Integraciones
            </a>
            <a className="hover:text-white" href="#precios">
              Precios
            </a>
            <Link className="hover:text-white" to="/login">
              Ingresar
            </Link>
            <a className="hover:text-white" href={`mailto:${contactEmail}`}>
              Contacto
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
