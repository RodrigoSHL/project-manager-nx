import {
  TRAINING_MUSCLES,
  type TrainingEquipment,
  type TrainingExercise,
  type TrainingMuscle,
  type TrainingSet,
} from '@project-manager/macrofit-contracts';

export const numberFormat = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 3,
});
export const sessionDateFormat = new Intl.DateTimeFormat('es-CL', {
  dateStyle: 'long',
});

export function formatTrainingNumber(value: number) {
  return numberFormat.format(value);
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
  equipment: TrainingEquipment | ''
) {
  const terms = normalizeTrainingSearch(query).split(' ').filter(Boolean);
  return catalog.filter((exercise) => {
    if (equipment && exercise.equipment !== equipment) return false;
    const searchable = normalizeTrainingSearch(
      [
        exercise.name,
        ...exercise.aliases,
        ...[...exercise.primary, ...exercise.secondary].map(
          (muscle) => TRAINING_MUSCLES[muscle]
        ),
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
  let volume = 0;
  const muscles: Partial<Record<TrainingMuscle, number>> = {};

  for (const { exercise, sets } of entries) {
    if (!sets.length) continue;
    exerciseCount++;
    setCount += sets.length;
    for (const { reps, weightKg } of sets) volume += reps * weightKg;
    for (const muscle of exercise.primary) {
      muscles[muscle] = (muscles[muscle] ?? 0) + sets.length;
    }
    for (const muscle of exercise.secondary) {
      muscles[muscle] = (muscles[muscle] ?? 0) + sets.length / 2;
    }
  }

  return { exerciseCount, setCount, volume, muscles };
}

export function muscleIntensity(equivalentSets: number) {
  if (equivalentSets >= 6) return 'high';
  if (equivalentSets >= 3) return 'medium';
  if (equivalentSets > 0) return 'low';
  return 'none';
}
