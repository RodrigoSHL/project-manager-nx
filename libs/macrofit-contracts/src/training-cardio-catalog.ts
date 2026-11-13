import type { TrainingEquipment, TrainingExercise } from './training';

const activities: [
  id: string,
  name: string,
  aliases: string[],
  equipment?: TrainingEquipment
][] = [
  ['football', 'Fútbol', ['futbolito', 'soccer', 'balompié']],
  ['swimming', 'Natación', ['nadar', 'swimming', 'piscina']],
  [
    'basketball',
    'Básquetbol',
    ['básquet', 'basketball', 'basquetball', 'baloncesto'],
  ],
  ['volleyball', 'Vóleibol', ['vólei', 'voley', 'volleyball', 'voleibol']],
  ['walking', 'Caminata', ['caminar', 'walking', 'marcha']],
  ['running', 'Trote o carrera', ['correr', 'running', 'jogging', 'trotar']],
  [
    'outdoor-cycling',
    'Ciclismo al aire libre',
    ['bicicleta', 'cycling', 'mountain bike', 'mtb'],
  ],
  ['hiking', 'Senderismo', ['trekking', 'hiking', 'excursión']],
  ['tennis', 'Tenis', ['tennis', 'raqueta']],
  ['padel', 'Pádel', ['padel', 'paddle tennis']],
  ['squash', 'Squash', ['squash']],
  ['table-tennis', 'Tenis de mesa', ['ping pong', 'pingpong', 'table tennis']],
  ['badminton', 'Bádminton', ['badminton']],
  ['handball', 'Balonmano', ['handball']],
  ['rugby', 'Rugby', ['rugby']],
  ['dancing', 'Baile', ['zumba', 'bailar', 'dance', 'aeróbica']],
  ['boxing', 'Boxeo', ['boxing', 'saco de boxeo']],
  [
    'jump-rope',
    'Salto de cuerda',
    ['saltar la cuerda', 'cuerda', 'jump rope', 'comba'],
  ],
  ['skating', 'Patinaje', ['patines', 'roller skating', 'inline skating']],
  [
    'treadmill-walking',
    'Caminata en cinta',
    ['caminadora', 'treadmill walk'],
    'machine',
  ],
  [
    'treadmill-running',
    'Trote en cinta',
    ['correr en caminadora', 'treadmill run'],
    'machine',
  ],
  ['elliptical', 'Elíptica', ['elliptical', 'máquina elíptica'], 'machine'],
  [
    'rowing-ergometer',
    'Remo en ergómetro',
    ['remo indoor', 'rowing machine', 'remo de cardio'],
    'machine',
  ],
  [
    'stair-climber',
    'Escaladora',
    ['stair climber', 'stairmaster', 'máquina de escaleras'],
    'machine',
  ],
];

export const CARDIO_TRAINING_CATALOG: TrainingExercise[] = activities.map(
  ([id, name, aliases, equipment = 'sport']) => ({
    id,
    name,
    aliases,
    equipment,
    kind: 'cardio',
    primary: [],
    secondary: [],
  })
);
