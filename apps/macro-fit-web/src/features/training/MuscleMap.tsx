import { useState, type ReactNode } from 'react';
import {
  TRAINING_MUSCLES,
  type TrainingMuscle,
} from '@project-manager/macrofit-contracts';
import {
  formatEquivalentSets,
  formatMuscleRecency,
  muscleIntensity,
  muscleRecency,
} from './training-model';

const body =
  'M90 8C72 8 65 21 66 36c1 17 5 25 13 32l-1 9c-8 5-21 8-34 12-15 5-22 19-24 36l-5 42-8 43c-3 15-1 22 3 26 4 2 6-2 8-10l3-11 1 7c1 4 5 3 5-2l1-14 11-39 8-36 6 25c1 13-5 26-7 40-5 24-3 54 2 78l4 28c-2 17-2 33 2 52l3 26-6 19c-2 7 2 10 8 10h16c5 0 7-5 6-10l-1-25 5-62 3-68 2-33 2 33 3 68 5 62-1 25c-1 5 1 10 6 10h16c6 0 10-3 8-10l-6-19 3-26c4-19 4-35 2-52l4-28c5-24 7-54 2-78-2-14-8-27-7-40l6-25 8 36 11 39 1 14c0 5 4 6 5 2l1-7 3 11c2 8 4 12 8 10 4-4 6-11 3-26l-8-43-5-42c-2-17-9-31-24-36-13-4-26-7-34-12l-1-9c8-7 12-15 13-32 1-15-6-28-24-28Z';

type Zone = { muscle: TrainingMuscle; path: string };

const front: Zone[] = [
  {
    muscle: 'shoulders',
    path: 'M43 92c7-3 12-4 17-3l-12 29c-7-5-14-6-24-2 3-10 9-20 19-24Z',
  },
  { muscle: 'chest', path: 'M63 88c10-2 17-2 25 3v31c-16 9-28 7-38-2Z' },
  { muscle: 'biceps', path: 'M24 120c7-5 15-4 23 1l-7 30c-4 7-11 9-20 4Z' },
  { muscle: 'forearms', path: 'M19 159c8 4 14 4 20-1l-12 43-14 6Z' },
  {
    muscle: 'abs',
    path: 'M73 130l15-4v13H73Zm0 12h15v12H74Zm1 15h14v12H76Zm3 15h11v22c-6-3-10-12-11-22Z',
  },
  {
    muscle: 'obliques',
    path: 'M52 124c5 4 11 6 18 6l3 44-16 15c3-15-2-30-5-44Z',
  },
  {
    muscle: 'quads',
    path: 'M56 191c6-8 11-10 17-12l5 20c-3 27-5 62-15 87-9-15-14-42-14-60 0-15 2-25 7-35Z',
  },
  {
    muscle: 'adductors',
    path: 'M80 202l8 6-3 39c-1 20-4 31-13 40 5-28 7-55 8-85Z',
  },
  {
    muscle: 'tibialis',
    path: 'M58 306c6-6 12-5 17 1 1 20-2 44-9 66-4-10-9-24-10-42-1-10 0-19 2-25Z',
  },
];

const back: Zone[] = [
  { muscle: 'traps', path: 'M79 77l9 5v75L56 92Z' },
  {
    muscle: 'rearDelts',
    path: 'M49 92l18 26c-8 3-14 8-19 16-7-9-13-14-23-12 2-15 9-24 24-30Z',
  },
  { muscle: 'triceps', path: 'M24 125c9-2 15 3 22 12l-6 15c-5 7-11 8-20 3Z' },
  { muscle: 'forearms', path: 'M19 159c8 4 14 4 20-1l-12 43-14 6Z' },
  { muscle: 'lats', path: 'M68 122l18 38-12 21-18-11-7-32c5-7 11-13 19-16Z' },
  { muscle: 'lowerBack', path: 'M88 161v30l-13-8Z' },
  { muscle: 'glutes', path: 'M55 175l32 19v21c-14 8-30 7-35-2-5-9-1-25 3-38Z' },
  {
    muscle: 'hamstrings',
    path: 'M50 218c7 6 19 9 36 1-1 27-4 51-16 69-8 0-17-22-19-38-2-13-2-24-1-32Z',
  },
  {
    muscle: 'calves',
    path: 'M56 305c7-9 14-7 20 1 4 21 0 46-10 63-7-10-12-24-13-41-1-8 0-17 3-23Z',
  },
];

const scale = [
  { id: 'none', color: '#374151', label: '0 · Sin series' },
  { id: 'low', color: '#8067c9', label: '0,5–2,5 · Baja' },
  { id: 'medium', color: '#bb9bff', label: '3–5,5 · Media' },
  { id: 'high', color: '#bef264', label: '6 o más · Alta' },
] as const;

const recencyScale = {
  recent: { color: '#bef264', label: '0–6 días · Reciente' },
  week: { color: '#fbbf24', label: '7–29 días sin registro' },
  month: { color: '#fb7185', label: '30 días o más sin registro' },
  unlogged: { color: '#374151', label: 'Sin registros de fuerza' },
};

export function MuscleMap({
  scores,
  title,
  children,
  progress,
  selectedActions,
}: {
  scores: Partial<Record<TrainingMuscle, number>>;
  title: string;
  children?: ReactNode;
  selectedActions?: (muscle: TrainingMuscle) => ReactNode;
  progress?: {
    daysAgo: Record<TrainingMuscle, number | null>;
    colorByRecency: boolean;
    details: (muscle: TrainingMuscle) => ReactNode;
  };
}) {
  const [selected, select] = useState<TrainingMuscle | null>(null);
  const colorByRecency = progress?.colorByRecency;
  const legend = colorByRecency ? Object.values(recencyScale) : scale;
  return (
    <section
      id="muscle-map"
      aria-labelledby="muscle-map-heading"
      className="scroll-mt-36 rounded-2xl border border-slate-800 bg-[#101624] p-4 sm:p-5"
    >
      <h2 id="muscle-map-heading" className="text-lg font-bold">
        {title}
      </h2>
      {children}
      <div
        className={`mx-auto mt-3 grid grid-cols-2 gap-3 ${
          progress ? 'max-w-lg' : 'max-w-[25rem]'
        }`}
      >
        {[
          { name: 'Frente', zones: front },
          { name: 'Espalda', zones: back },
        ].map(({ name, zones }) => (
          <figure key={name} className="min-w-0">
            <svg
              viewBox="0 0 180 414"
              role="group"
              aria-label={`Vista muscular: ${name}`}
              className={`mx-auto block w-full ${
                progress ? 'max-w-[12rem]' : 'max-w-[10rem]'
              }`}
            >
              <path
                d={body}
                fill="#222b3b"
                stroke="#465267"
                strokeWidth="1.4"
                aria-hidden="true"
              />
              {zones.map(({ muscle, path }) => {
                const value = scores[muscle] ?? 0;
                const recency = colorByRecency
                  ? muscleRecency(progress.daysAgo[muscle])
                  : null;
                const intensity = recency ?? muscleIntensity(value);
                const fill = recency
                  ? recencyScale[recency].color
                  : scale.find(({ id }) => id === intensity)?.color;
                const description = colorByRecency
                  ? formatMuscleRecency(progress.daysAgo[muscle])
                  : formatEquivalentSets(value);
                const active = selected === muscle;
                return (
                  <g
                    key={muscle}
                    role="button"
                    tabIndex={0}
                    aria-label={`${TRAINING_MUSCLES[muscle]} · ${description}`}
                    aria-pressed={active}
                    className="group cursor-pointer outline-none"
                    onClick={() => select(muscle)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        select(muscle);
                      }
                    }}
                  >
                    {[false, true].map((mirror) => (
                      <path
                        key={String(mirror)}
                        d={path}
                        transform={
                          mirror ? 'translate(180 0) scale(-1 1)' : undefined
                        }
                        fill={fill}
                        stroke={active ? '#f8fafc' : '#131b2a'}
                        strokeWidth={active ? 1.8 : 1.1}
                        className="transition-colors group-hover:stroke-slate-200 group-focus-visible:stroke-white"
                        data-muscle={muscle}
                        data-intensity={intensity}
                        aria-hidden="true"
                      />
                    ))}
                  </g>
                );
              })}
            </svg>
            <figcaption className="mt-1 text-center text-sm font-medium text-slate-400">
              {name}
            </figcaption>
          </figure>
        ))}
      </div>
      <div
        className="mt-4 min-h-6 space-y-1 rounded-lg bg-slate-950/65 px-3 py-2 text-sm font-semibold text-slate-100"
        aria-live="polite"
      >
        {selected && progress
          ? progress.details(selected)
          : selected
          ? `${TRAINING_MUSCLES[selected]} · ${formatEquivalentSets(
              scores[selected] ?? 0
            )}`
          : progress
          ? 'Toca un músculo para ver su último registro y sus series.'
          : 'Toca un músculo para ver sus series equivalentes.'}
      </div>
      {selected && selectedActions?.(selected)}
      <ul
        aria-label={
          colorByRecency
            ? 'Días desde el último registro'
            : 'Intensidad por series equivalentes'
        }
        className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300"
      >
        {legend.map(({ color, label }) => (
          <li key={label} className="flex items-center gap-1.5">
            <span
              className="size-3 shrink-0 rounded-sm"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            {label}
          </li>
        ))}
      </ul>
      {!colorByRecency && (
        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          Cada serie aporta 1 a cada músculo principal y 0,5 a cada secundario.
          Los kilos se cuentan en el volumen externo.
        </p>
      )}
    </section>
  );
}
