import { z } from 'zod';
import { dateSchema } from './schemas';

export const trainingMuscleSchema = z.enum([
  'chest',
  'shoulders',
  'rearDelts',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'obliques',
  'traps',
  'lats',
  'lowerBack',
  'glutes',
  'quads',
  'adductors',
  'hamstrings',
  'calves',
  'tibialis',
]);
export const trainingEquipmentSchema = z.enum([
  'machine',
  'free',
  'bodyweight',
  'cable',
  'band',
  'sport',
]);
export type TrainingMuscle = z.infer<typeof trainingMuscleSchema>;
export type TrainingEquipment = z.infer<typeof trainingEquipmentSchema>;

export const MAX_TRAINING_EXERCISES = 40;
export const MAX_TRAINING_SETS = 80;
export const TRAINING_HISTORY_PAGE_SIZE = 20;
export const MAX_TRAINING_ROUTINE_NAME_LENGTH = 100;

export const TRAINING_MUSCLES = {
  chest: 'Pectorales',
  shoulders: 'Deltoides anteriores y laterales',
  rearDelts: 'Deltoides posteriores',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  forearms: 'Antebrazos',
  abs: 'Abdominales',
  obliques: 'Oblicuos',
  traps: 'Trapecios',
  lats: 'Dorsales',
  lowerBack: 'Zona lumbar',
  glutes: 'Glúteos',
  quads: 'Cuádriceps',
  adductors: 'Aductores',
  hamstrings: 'Isquiotibiales',
  calves: 'Pantorrillas',
  tibialis: 'Tibiales',
} as const satisfies Record<TrainingMuscle, string>;

export const TRAINING_EQUIPMENT = {
  machine: 'Máquina',
  free: 'Peso libre',
  bodyweight: 'Peso corporal',
  cable: 'Polea',
  band: 'Banda',
  sport: 'Actividad deportiva',
} as const satisfies Record<TrainingEquipment, string>;

export const trainingSessionIdSchema = z.string().uuid();
export const trainingDateSchema = dateSchema.refine(
  (day) => !day.startsWith('0000-')
);
const uuid = trainingSessionIdSchema;
const dateTime = z.string().datetime();
const revision = z.number().int().min(0).max(2147483647);

function unique<T>(values: T[]) {
  return new Set(values).size === values.length;
}

export const trainingExerciseSchema = z
  .object({
    id: z.string().min(1).max(100),
    name: z.string().trim().min(1).max(100),
    aliases: z.array(z.string().trim().min(1).max(100)).max(12),
    equipment: trainingEquipmentSchema,
    kind: z.literal('cardio').optional(),
    primary: z.array(trainingMuscleSchema),
    secondary: z.array(trainingMuscleSchema),
  })
  .strict()
  .refine(
    ({ kind, primary, equipment }) =>
      kind === 'cardio' || (primary.length > 0 && equipment !== 'sport'),
    {
      message:
        'Los ejercicios de fuerza requieren un músculo principal y equipamiento de fuerza.',
    }
  )
  .refine(({ primary, secondary }) => unique([...primary, ...secondary]), {
    message: 'Cada músculo debe seleccionarse una sola vez.',
  });

export const customTrainingExerciseSchema = trainingExerciseSchema.refine(
  ({ id, kind }) => uuid.safeParse(id).success && kind === undefined
);

export const strengthTrainingSetSchema = z
  .object({
    id: uuid,
    reps: z.number().int().min(1).max(999),
    weightKg: z.number().finite().min(0).max(9999),
  })
  .strict();

export const cardioTrainingSetSchema = z
  .object({
    id: uuid,
    durationMinutes: z.number().finite().min(0.1).max(1440),
    intensity: z.enum(['light', 'moderate', 'vigorous']).optional(),
  })
  .strict();

export const trainingSetSchema = z.union([
  strengthTrainingSetSchema,
  cardioTrainingSetSchema,
]);

const trainingSets = z
  .array(trainingSetSchema)
  .max(MAX_TRAINING_SETS)
  .refine((sets) => unique(sets.map(({ id }) => id)));

const draftExercises = z
  .array(
    z
      .object({
        exerciseId: z.string().min(1).max(100),
        sets: trainingSets,
      })
      .strict()
  )
  .max(MAX_TRAINING_EXERCISES)
  .refine((exercises) => unique(exercises.map(({ exerciseId }) => exerciseId)));

export const trainingDraftSchema = z
  .object({
    id: uuid,
    startedAt: dateTime,
    performedOn: trainingDateSchema.optional(),
    exercises: draftExercises,
  })
  .strict();

export const trainingDraftStateSchema = z.object({
  revision,
  draft: trainingDraftSchema.nullable(),
});
export const saveTrainingDraftSchema = z
  .object({
    revision,
    draft: trainingDraftSchema,
  })
  .strict();
export const finishTrainingSchema = z.object({ revision, id: uuid }).strict();

export const completedTrainingSchema = z.object({
  id: uuid,
  startedAt: dateTime,
  finishedAt: dateTime,
  performedOn: trainingDateSchema,
  revision,
  exercises: z.array(
    z.object({
      exercise: trainingExerciseSchema,
      sets: trainingSets,
    })
  ),
});
export const updateCompletedTrainingSchema = z
  .object({
    revision,
    performedOn: trainingDateSchema,
    exercises: draftExercises.refine((exercises) =>
      exercises.some(({ sets }) => sets.length > 0)
    ),
  })
  .strict();
export const trainingEditResultSchema = z.object({
  session: completedTrainingSchema,
  lastCompleted: completedTrainingSchema.nullable(),
});
export const trainingFinishStateSchema = trainingDraftStateSchema.extend({
  lastCompleted: completedTrainingSchema.nullable(),
});
export const createTrainingRoutineSchema = z
  .object({
    id: uuid,
    sessionId: uuid,
    name: z.string().trim().min(1).max(MAX_TRAINING_ROUTINE_NAME_LENGTH),
  })
  .strict();
export const trainingRoutineSchema = createTrainingRoutineSchema.extend({
  exercises: completedTrainingSchema.shape.exercises,
});
export const trainingWorkspaceSchema = trainingFinishStateSchema.extend({
  customExercises: z.array(customTrainingExerciseSchema),
  routines: z.array(trainingRoutineSchema).optional(),
});
export const trainingHistorySchema = z.object({
  sessions: z.array(completedTrainingSchema),
  nextOffset: z.number().int().nonnegative().nullable(),
});
export const trainingHistoryQuerySchema = z
  .object({
    offset: z
      .string()
      .regex(/^\d{1,9}$/)
      .optional(),
    from: trainingDateSchema.optional(),
    to: trainingDateSchema.optional(),
  })
  .strict()
  .refine(({ from, to }) => {
    if (!from || !to) return from === to;
    const days = (Date.parse(to) - Date.parse(from)) / 86_400_000;
    return days >= 0 && days <= 6;
  }, 'Selecciona un período de hasta siete días.');

export type TrainingExercise = z.infer<typeof trainingExerciseSchema>;
export type TrainingSet = z.infer<typeof trainingSetSchema>;
export type StrengthTrainingSet = z.infer<typeof strengthTrainingSetSchema>;
export type CardioTrainingSet = z.infer<typeof cardioTrainingSetSchema>;
export type TrainingDraft = z.infer<typeof trainingDraftSchema>;
export type TrainingDraftState = z.infer<typeof trainingDraftStateSchema>;
export type SaveTrainingDraft = z.infer<typeof saveTrainingDraftSchema>;
export type FinishTraining = z.infer<typeof finishTrainingSchema>;
export type TrainingWorkspace = z.infer<typeof trainingWorkspaceSchema>;
export type CompletedTraining = z.infer<typeof completedTrainingSchema>;
export type UpdateCompletedTraining = z.infer<
  typeof updateCompletedTrainingSchema
>;
export type TrainingHistory = z.infer<typeof trainingHistorySchema>;
export type CreateTrainingRoutine = z.infer<typeof createTrainingRoutineSchema>;
export type TrainingRoutine = z.infer<typeof trainingRoutineSchema>;
