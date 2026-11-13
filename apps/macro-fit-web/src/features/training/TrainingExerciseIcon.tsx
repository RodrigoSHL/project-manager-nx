import {
  Activity,
  Bike,
  Cable,
  CircleDot,
  Dumbbell,
  Footprints,
  Goal,
  PersonStanding,
  SlidersVertical,
  StretchHorizontal,
  Volleyball,
  WavesLadder,
  type LucideIcon,
} from 'lucide-react';
import type {
  TrainingEquipment,
  TrainingExercise,
} from '@project-manager/macrofit-contracts';

const equipmentIcons = {
  machine: {
    icon: SlidersVertical,
    color: 'border-sky-400/20 bg-sky-400/10 text-sky-300',
  },
  free: {
    icon: Dumbbell,
    color: 'border-lime-400/20 bg-lime-400/10 text-lime-300',
  },
  cable: {
    icon: Cable,
    color: 'border-violet-400/20 bg-violet-400/10 text-violet-300',
  },
  bodyweight: {
    icon: PersonStanding,
    color: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300',
  },
  band: {
    icon: StretchHorizontal,
    color: 'border-amber-400/20 bg-amber-400/10 text-amber-300',
  },
  sport: {
    icon: Activity,
    color: 'border-cyan-400/20 bg-cyan-400/10 text-cyan-300',
  },
} satisfies Record<TrainingEquipment, { icon: LucideIcon; color: string }>;

const cardioIcons: Partial<Record<string, LucideIcon>> = {
  'stationary-bike': Bike,
  'outdoor-cycling': Bike,
  football: Goal,
  swimming: WavesLadder,
  basketball: CircleDot,
  volleyball: Volleyball,
  walking: Footprints,
  running: Footprints,
  hiking: Footprints,
};

export function TrainingExerciseIcon({
  id,
  equipment,
  kind,
}: {
  id: string;
  equipment: TrainingEquipment;
  kind?: TrainingExercise['kind'];
}) {
  const { icon: Icon, color } =
    kind === 'cardio'
      ? { ...equipmentIcons.sport, icon: cardioIcons[id] ?? Activity }
      : equipmentIcons[equipment];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl border ${color}`}
    >
      <Icon size={19} strokeWidth={1.8} />
    </span>
  );
}
