import { ADDITIONAL_TRAINING_EXERCISES } from './training-catalog-additions';
import { CARDIO_TRAINING_CATALOG } from './training-cardio-catalog';
import type {
  TrainingEquipment,
  TrainingExercise,
  TrainingMuscle,
} from './training';

function exercise(
  id: string,
  name: string,
  equipment: TrainingEquipment,
  aliases: string[],
  primary: TrainingMuscle[],
  secondary: TrainingMuscle[] = []
): TrainingExercise {
  return { id, name, equipment, aliases, primary, secondary };
}

export const TRAINING_CATALOG: readonly TrainingExercise[] = [
  exercise(
    'leg-extension',
    'Extensión de piernas',
    'machine',
    ['leg extension', 'extensión de rodillas'],
    ['quads']
  ),
  exercise(
    'hack-squat',
    'Sentadilla hack',
    'machine',
    ['hack squat'],
    ['quads'],
    ['glutes', 'adductors']
  ),
  exercise(
    'leg-press',
    'Prensa de piernas',
    'machine',
    ['leg press', 'prensa'],
    ['quads', 'glutes'],
    ['adductors']
  ),
  exercise(
    'leg-curl',
    'Curl femoral',
    'machine',
    ['leg curl', 'curl de piernas'],
    ['hamstrings'],
    ['calves']
  ),
  exercise(
    'calf-raise',
    'Elevación de talones en máquina',
    'machine',
    ['calf raise', 'gemelos'],
    ['calves']
  ),
  exercise(
    'hip-adduction',
    'Aducción de cadera en máquina',
    'machine',
    ['hip adduction'],
    ['adductors']
  ),
  exercise(
    'bench-press',
    'Press de banca',
    'free',
    ['bench press', 'press de pecho'],
    ['chest'],
    ['triceps', 'shoulders']
  ),
  exercise(
    'romanian-deadlift',
    'Peso muerto rumano',
    'free',
    ['romanian deadlift', 'rdl'],
    ['hamstrings', 'glutes'],
    ['lowerBack', 'forearms']
  ),
  exercise(
    'barbell-squat',
    'Sentadilla con barra',
    'free',
    ['barbell squat', 'back squat'],
    ['quads', 'glutes'],
    ['adductors', 'abs', 'lowerBack']
  ),
  exercise(
    'overhead-press',
    'Press militar',
    'free',
    ['overhead press', 'shoulder press'],
    ['shoulders'],
    ['triceps', 'traps']
  ),
  exercise(
    'dumbbell-row',
    'Remo con mancuerna',
    'free',
    ['dumbbell row', 'remo unilateral'],
    ['lats'],
    ['biceps', 'rearDelts', 'traps']
  ),
  exercise(
    'dumbbell-curl',
    'Curl de bíceps con mancuernas',
    'free',
    ['dumbbell curl'],
    ['biceps'],
    ['forearms']
  ),
  exercise(
    'hip-thrust',
    'Empuje de cadera',
    'free',
    ['hip thrust'],
    ['glutes'],
    ['hamstrings']
  ),
  exercise(
    'lat-pulldown',
    'Jalón al pecho',
    'cable',
    ['lat pulldown', 'jalón dorsal'],
    ['lats'],
    ['biceps', 'forearms']
  ),
  exercise(
    'cable-row',
    'Remo en polea',
    'cable',
    ['cable row', 'remo sentado', 'remo'],
    ['lats', 'traps'],
    ['biceps', 'rearDelts']
  ),
  exercise(
    'cable-pushdown',
    'Extensión de tríceps en polea',
    'cable',
    ['triceps pushdown'],
    ['triceps']
  ),
  exercise(
    'face-pull',
    'Face pull en polea',
    'cable',
    ['face pull', 'jalón a la cara'],
    ['rearDelts'],
    ['traps']
  ),
  exercise(
    'push-up',
    'Flexiones',
    'bodyweight',
    ['push up', 'push-up', 'lagartijas'],
    ['chest'],
    ['triceps', 'shoulders', 'abs']
  ),
  exercise(
    'pull-up',
    'Dominadas',
    'bodyweight',
    ['pull up', 'pull-up'],
    ['lats'],
    ['biceps', 'forearms']
  ),
  exercise(
    'plank',
    'Plancha abdominal',
    'bodyweight',
    ['plank'],
    ['abs'],
    ['obliques']
  ),
  exercise(
    'tibialis-raise',
    'Elevación de puntas',
    'bodyweight',
    ['tibialis raise'],
    ['tibialis']
  ),
  exercise(
    'band-pull-apart',
    'Apertura con banda',
    'band',
    ['band pull apart'],
    ['rearDelts'],
    ['traps']
  ),
  exercise(
    'band-lateral-walk',
    'Caminata lateral con banda',
    'band',
    ['band lateral walk', 'monster walk'],
    ['glutes']
  ),
  exercise(
    'band-curl',
    'Curl de bíceps con banda',
    'band',
    ['band curl'],
    ['biceps'],
    ['forearms']
  ),
  ...ADDITIONAL_TRAINING_EXERCISES,
  {
    id: 'stationary-bike',
    name: 'Bicicleta estática',
    aliases: [
      'bicicleta fija',
      'bici estática',
      'spinning',
      'cicloergómetro',
      'stationary bike',
      'cardio',
    ],
    equipment: 'machine',
    kind: 'cardio',
    primary: ['quads'],
    secondary: ['glutes', 'hamstrings', 'calves'],
  },
  ...CARDIO_TRAINING_CATALOG,
];
