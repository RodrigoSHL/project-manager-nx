import React from 'react';
import { Flame, Beef, Wheat, Droplets } from 'lucide-react';
import { MacroGoals } from '../types/nutrition';

interface MacroProgressRingsProps {
  goals: MacroGoals;
  consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export const MacroProgressRings: React.FC<MacroProgressRingsProps> = ({ goals, consumed }) => {
  const caloriesRemaining = goals.calories - consumed.calories;
  const caloriesPercent = Math.min(100, Math.round((consumed.calories / (goals.calories || 1)) * 100));

  const proteinPercent = Math.min(100, Math.round((consumed.protein / (goals.proteinGrams || 1)) * 100));
  const carbsPercent = Math.min(100, Math.round((consumed.carbs / (goals.carbsGrams || 1)) * 100));
  const fatPercent = Math.min(100, Math.round((consumed.fat / (goals.fatGrams || 1)) * 100));

  // Circular gauge for calories
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (caloriesPercent / 100) * circumference;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
      {/* Hero Circular Calories Card */}
      <div className="md:col-span-1 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="text-slate-800/80 stroke-current"
              strokeWidth="12"
              fill="transparent"
            />
            {/* Progress arc */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="text-emerald-400 stroke-current transition-all duration-700 ease-out"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <Flame className="w-5 h-5 text-emerald-400 mb-0.5 animate-pulse-subtle" />
            <span className="text-2xl font-extrabold text-white tracking-tight leading-none">
              {consumed.calories}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              / {goals.calories} kcal
            </span>
          </div>
        </div>

        <div className="mt-2 text-center">
          <span className="text-xs font-semibold text-slate-300">
            {caloriesRemaining >= 0 ? (
              <>
                Te quedan <span className="text-emerald-400 font-bold">{caloriesRemaining} kcal</span>
              </>
            ) : (
              <>
                Excedido en <span className="text-rose-400 font-bold">{Math.abs(caloriesRemaining)} kcal</span>
              </>
            )}
          </span>
          <div className="text-[11px] text-slate-500 mt-0.5">{caloriesPercent}% de tu meta diaria</div>
        </div>
      </div>

      {/* 3 Macro Breakdown Cards */}
      <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Proteínas */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800/90 p-4 flex flex-col justify-between hover:border-emerald-500/40 transition">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Beef className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Proteínas</h4>
                  <span className="text-[10px] text-slate-400">4 kcal / g</span>
                </div>
              </div>
              <span className="text-xs font-extrabold text-emerald-400">{proteinPercent}%</span>
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <div className="text-xl font-extrabold text-white">
                {consumed.protein.toFixed(1)} <span className="text-xs text-slate-400 font-normal">g</span>
              </div>
              <div className="text-xs text-slate-400 font-medium">Meta: {goals.proteinGrams}g</div>
            </div>
          </div>

          <div className="mt-3">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${proteinPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
              <span>
                {goals.proteinGrams - consumed.protein > 0
                  ? `Faltan ${(goals.proteinGrams - consumed.protein).toFixed(1)}g`
                  : 'Meta alcanzada 🎉'}
              </span>
              <span className="text-slate-500">{Math.round(consumed.protein * 4)} kcal</span>
            </div>
          </div>
        </div>

        {/* Carbohidratos */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800/90 p-4 flex flex-col justify-between hover:border-amber-500/40 transition">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Wheat className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Carbohidratos</h4>
                  <span className="text-[10px] text-slate-400">4 kcal / g</span>
                </div>
              </div>
              <span className="text-xs font-extrabold text-amber-400">{carbsPercent}%</span>
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <div className="text-xl font-extrabold text-white">
                {consumed.carbs.toFixed(1)} <span className="text-xs text-slate-400 font-normal">g</span>
              </div>
              <div className="text-xs text-slate-400 font-medium">Meta: {goals.carbsGrams}g</div>
            </div>
          </div>

          <div className="mt-3">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-yellow-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${carbsPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
              <span>
                {goals.carbsGrams - consumed.carbs > 0
                  ? `Faltan ${(goals.carbsGrams - consumed.carbs).toFixed(1)}g`
                  : 'Meta alcanzada 🎉'}
              </span>
              <span className="text-slate-500">{Math.round(consumed.carbs * 4)} kcal</span>
            </div>
          </div>
        </div>

        {/* Grasas */}
        <div className="rounded-2xl bg-slate-900/80 border border-slate-800/90 p-4 flex flex-col justify-between hover:border-rose-500/40 transition">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Grasas Saludables</h4>
                  <span className="text-[10px] text-slate-400">9 kcal / g</span>
                </div>
              </div>
              <span className="text-xs font-extrabold text-rose-400">{fatPercent}%</span>
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <div className="text-xl font-extrabold text-white">
                {consumed.fat.toFixed(1)} <span className="text-xs text-slate-400 font-normal">g</span>
              </div>
              <div className="text-xs text-slate-400 font-medium">Meta: {goals.fatGrams}g</div>
            </div>
          </div>

          <div className="mt-3">
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-rose-500 to-pink-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${fatPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
              <span>
                {goals.fatGrams - consumed.fat > 0
                  ? `Faltan ${(goals.fatGrams - consumed.fat).toFixed(1)}g`
                  : 'Meta alcanzada 🎉'}
              </span>
              <span className="text-slate-500">{Math.round(consumed.fat * 9)} kcal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
