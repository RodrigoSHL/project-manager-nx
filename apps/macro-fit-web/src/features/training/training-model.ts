import {
  TRAINING_MUSCLES,
  type CardioTrainingSet,
  type TrainingEquipment,
  type TrainingExercise,
  type TrainingMuscle,
  type TrainingSet,
} from '@project-manager/macrofit-contracts';

export const numberFormat = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 3,
});
const sessionDateFormat = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'long',
  timeZone: 'UTC',
});

export function formatTrainingDay(day: string) {
  return sessionDateFormat.format(new Date(`${day}T00:00:00Z`));
}

export function formatTrainingNumber(value: number) {
  return numberFormat.format(value);
}

export const CARDIO_INTENSITIES = {
  light: 'Suave',
  moderate: 'Moderada',
  vigorous: 'Intensa',
} as const;

export function formatCardio(set: CardioTrainingSet) {
  const minutes = `${formatTrainingNumber(set.durationMinutes)} min`;
  return set.intensity
    ? `${minutes} · ${CARDIO_INTENSITIES[set.intensity]}`
    : minutes;
}

export function formatEquivalentSets(value: number) {
  return `${formatTrainingNumber(value)} ${
    value === 1 ? 'serie equivalente' : 'series equivalentes'
  }`;
}

export function normalizeTrainingSearch(value: string) {
  return value
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function filterTrainingExercises(
  catalog: readonly TrainingExercise[],
  query: string,
  equipment: TrainingEquipment | '',
  muscle: TrainingMuscle | ''
) {
  const terms = normalizeTrainingSearch(query).split(' ').filter(Boolean);
  return catalog.filter((exercise) => {
    if (equipment && exercise.equipment !== equipment) return false;
    const muscles = [...exercise.primary, ...exercise.secondary];
    if (muscle && !muscles.includes(muscle)) return false;
    const searchable = normalizeTrainingSearch(
      [
        exercise.name,
        exercise.kind,
        ...exercise.aliases,
        ...muscles.map((id) => TRAINING_MUSCLES[id]),
      ].join(' ')
    );
    return terms.every((term) => searchable.includes(term));
  });
}

export function summarizeTraining(
  entries: readonly { exercise: TrainingExercise; sets: TrainingSet[] }[]
) {
  let exerciseCount = 0;
  let setCount = 0;
  let cardioMinutes = 0;
  let volume = 0;
  const muscles: Partial<Record<TrainingMuscle, number>> = {};

  for (const { exercise, sets } of entries) {
    if (!sets.length) continue;
    exerciseCount++;
    let strengthSets = 0;
    for (const set of sets) {
      if ('durationMinutes' in set) {
        cardioMinutes += set.durationMinutes;
      } else {
        strengthSets++;
        volume += set.reps * set.weightKg;
      }
    }
    if (!strengthSets) continue;
    setCount += strengthSets;
    for (const muscle of exercise.primary) {
      muscles[muscle] = (muscles[muscle] ?? 0) + strengthSets;
    }
    for (const muscle of exercise.secondary) {
      muscles[muscle] = (muscles[muscle] ?? 0) + strengthSets / 2;
    }
  }

  return { exerciseCount, setCount, cardioMinutes, volume, muscles };
}

export function muscleIntensity(equivalentSets: number) {
  if (equivalentSets >= 6) return 'high';
  if (equivalentSets >= 3) return 'medium';
  if (equivalentSets > 0) return 'low';
  return 'none';
}

const dayMilliseconds = 86_400_000;

export const trainingGaps = { week: 7, month: 30 } as const;

export function daysBetweenTrainingDates(from: string, to: string) {
  return (Date.parse(to) - Date.parse(from)) / dayMilliseconds;
}

export type TrainingProgressSession = {
  id: string;
  performedOn: string;
  exercises: Parameters<typeof summarizeTraining>[0];
};

export type MuscleProgress = {
  latestDay: string | null;
  week: number;
  month: number;
  total: number;
};

export const trainingMuscleIds = Object.keys(TRAINING_MUSCLES) as TrainingMuscle[];

export function summarizeTrainingProgress(
  sessions: Iterable<TrainingProgressSession>,
  today: string
) {
  const muscles = {} as Record<TrainingMuscle, MuscleProgress>;
  for (const muscle of trainingMuscleIds)
    muscles[muscle] = { latestDay: null, week: 0, month: 0, total: 0 };
  const sessionsByPeriod = { week: 0, month: 0, total: 0 };

  for (const { performedOn, exercises } of sessions) {
    const daysAgo = daysBetweenTrainingDates(performedOn, today);
    if (daysAgo < 0) continue;
    const { setCount, muscles: scores } = summarizeTraining(exercises);
    if (!setCount) continue;
    const inWeek = daysAgo < trainingGaps.week;
    const inMonth = daysAgo < trainingGaps.month;
    sessionsByPeriod.total++;
    if (inWeek) sessionsByPeriod.week++;
    if (inMonth) sessionsByPeriod.month++;

    for (const muscle of trainingMuscleIds) {
      const score = scores[muscle];
      if (!score) continue;
      const progress = muscles[muscle];
      progress.total += score;
      if (inWeek) progress.week += score;
      if (inMonth) progress.month += score;
      if (!progress.latestDay || performedOn > progress.latestDay)
        progress.latestDay = performedOn;
    }
  }

  return { muscles, sessionsByPeriod };
}

export type MuscleRecency = 'recent' | 'week' | 'month' | 'unlogged';

export function muscleRecency(daysAgo: number | null): MuscleRecency {
  if (daysAgo === null) return 'unlogged';
  if (daysAgo >= trainingGaps.month) return 'month';
  if (daysAgo >= trainingGaps.week) return 'week';
  return 'recent';
}

export function formatMuscleRecency(daysAgo: number | null) {
  if (daysAgo === null) return 'Sin registros de fuerza';
  if (daysAgo === 0) return 'Último registro hoy';
  return `Último registro hace ${daysAgo} ${daysAgo === 1 ? 'día' : 'días'}`;
}
