import { Flame, Beef, Wheat, Droplets } from 'lucide-react';
import { MacroGoals } from '../types/nutrition';

interface MacroProgressRingsProps {
  goals: MacroGoals;
  consumed: { calories: number; protein: number; carbs: number; fat: number };
}
const number = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 });

export function MacroProgressRings({
  goals,
  consumed,
}: MacroProgressRingsProps) {
  const caloriesRemaining = goals.calories - consumed.calories;
  const caloriesPercent = Math.min(
    100,
    Math.round((consumed.calories / (goals.calories || 1)) * 100)
  );
  const circumference = 2 * Math.PI * 64;
  const macros = [
    {
      label: 'Proteínas',
      value: consumed.protein,
      target: goals.proteinGrams,
      factor: 4,
      Icon: Beef,
      color: 'text-emerald-400',
      background: 'bg-emerald-500/10',
      bar: 'from-emerald-500 to-teal-400',
    },
    {
      label: 'Carbohidratos',
      value: consumed.carbs,
      target: goals.carbsGrams,
      factor: 4,
      Icon: Wheat,
      color: 'text-amber-400',
      background: 'bg-amber-500/10',
      bar: 'from-amber-500 to-yellow-400',
    },
    {
      label: 'Grasas',
      value: consumed.fat,
      target: goals.fatGrams,
      factor: 9,
      Icon: Droplets,
      color: 'text-rose-400',
      background: 'bg-rose-500/10',
      bar: 'from-rose-500 to-pink-400',
    },
  ];
  return (
    <section
      aria-label="Calorías y macronutrientes del día"
      className="grid gap-2 md:grid-cols-4 md:gap-3.5"
    >
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-3 md:flex md:flex-col md:items-center md:justify-center md:p-4">
        <div className="flex items-center justify-between gap-3 md:hidden">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Flame className="size-3.5 text-emerald-400" aria-hidden="true" />
              Energía consumida
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-white">
              {number.format(consumed.calories)}{' '}
              <span className="text-xs font-normal text-slate-400">
                / {number.format(goals.calories)} kcal
              </span>
            </p>
          </div>
          <p
            className={`text-right text-xs ${
              caloriesRemaining >= 0 ? 'text-emerald-300' : 'text-rose-300'
            }`}
          >
            {caloriesRemaining >= 0 ? 'Te quedan' : 'Excedido en'}
            <strong className="mt-1 block tabular-nums">
              {number.format(Math.abs(caloriesRemaining))} kcal
            </strong>
          </p>
        </div>
        <div
          className="mt-2 h-1 overflow-hidden rounded-full bg-slate-800 md:hidden"
          aria-hidden="true"
        >
          <div
            className="h-full bg-emerald-400"
            style={{ width: `${caloriesPercent}%` }}
          />
        </div>
        <div className="hidden md:block">
          <div className="relative flex size-36 items-center justify-center">
            <svg
              className="size-full -rotate-90"
              viewBox="0 0 160 160"
              aria-hidden="true"
            >
              <circle
                cx="80"
                cy="80"
                r="64"
                className="stroke-current text-slate-800/80"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="80"
                cy="80"
                r="64"
                className="stroke-current text-emerald-400 transition-all duration-700"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={
                  circumference - (caloriesPercent / 100) * circumference
                }
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <Flame
                className="mb-0.5 size-5 text-emerald-400"
                aria-hidden="true"
              />
              <span className="text-2xl font-extrabold text-white">
                {number.format(consumed.calories)}
              </span>
              <span className="mt-0.5 text-[10px] font-semibold text-slate-400">
                / {number.format(goals.calories)} kcal
              </span>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-slate-300">
            {caloriesRemaining >= 0 ? 'Te quedan' : 'Excedido en'}{' '}
            <strong
              className={
                caloriesRemaining >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }
            >
              {number.format(Math.abs(caloriesRemaining))} kcal
            </strong>
          </p>
          <p className="mt-0.5 text-center text-[11px] text-slate-500">
            {caloriesPercent}% de tu meta diaria
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 md:col-span-3 md:gap-3">
        {macros.map(
          ({ label, value, target, factor, Icon, color, background, bar }) => {
            const percent = Math.min(
              100,
              Math.round((value / (target || 1)) * 100)
            );
            return (
              <div
                key={label}
                className="flex min-w-0 flex-col justify-between rounded-xl border border-slate-800/90 bg-slate-900/80 p-2.5 md:rounded-2xl md:p-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 md:mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`hidden rounded-xl p-2 md:block ${background} ${color}`}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-[11px] font-semibold text-slate-300 md:text-xs">
                          {label}
                        </h3>
                        <span className="hidden text-[10px] text-slate-400 md:inline">
                          {factor} kcal / g
                        </span>
                      </div>
                    </div>
                    <span
                      className={`hidden text-xs font-bold md:inline ${color}`}
                    >
                      {percent}%
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-1 md:mt-2 md:justify-between">
                    <p
                      className={`text-lg font-bold tabular-nums md:text-xl ${color}`}
                    >
                      {number.format(value)}{' '}
                      <span className="text-[10px] font-normal md:text-xs">
                        g
                      </span>
                    </p>
                    <p className="text-[10px] text-slate-400 md:text-xs">
                      <span className="md:hidden">de </span>
                      <span className="hidden md:inline">Meta: </span>
                      {number.format(target)} g
                    </p>
                  </div>
                </div>
                <div className="mt-2 md:mt-3">
                  <div
                    className="h-1 overflow-hidden rounded-full bg-slate-800 md:h-2"
                    aria-hidden="true"
                  >
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${bar}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="mt-1 flex flex-wrap justify-between gap-x-1 text-[10px] text-slate-400 md:text-[11px]">
                    <span>
                      {target - value > 0
                        ? `Faltan ${number.format(target - value)} g`
                        : value === target
                        ? 'Meta alcanzada'
                        : `${number.format(value - target)} g de más`}
                    </span>
                    <span className="hidden text-slate-500 md:inline">
                      {Math.round(value * factor)} kcal
                    </span>
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>
    </section>
  );
}
