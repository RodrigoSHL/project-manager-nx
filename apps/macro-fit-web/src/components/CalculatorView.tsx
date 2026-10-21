import React, { useState } from 'react';
import {
  Sparkles,
  Calculator,
  Flame,
  Beef,
  Wheat,
  Droplets,
  CheckCircle,
  HelpCircle,
  Dumbbell,
  Scale,
  Activity,
  Target,
} from 'lucide-react';
import {
  ActivityLevel,
  Gender,
  Goal,
  MacroDistributionPreset,
  UserProfile,
} from '../types/nutrition';
import {
  ACTIVITY_LABELS,
  GOAL_ADJUSTMENTS,
  PRESET_RATIOS,
  generateNutritionPlan,
} from '../utils/calculator';

interface CalculatorViewProps {
  initialProfile: UserProfile;
  initialPreset: MacroDistributionPreset;
  onApplyPlan: (profile: UserProfile, goals: ReturnType<typeof generateNutritionPlan>['goals']) => void;
  onGoToTracker: () => void;
}

export const CalculatorView: React.FC<CalculatorViewProps> = ({
  initialProfile,
  initialPreset,
  onApplyPlan,
  onGoToTracker,
}) => {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [preset, setPreset] = useState<MacroDistributionPreset>(
    initialPreset === 'custom' ? 'high_protein' : initialPreset
  );
  const [justSaved, setJustSaved] = useState(false);

  // Compute live calculation
  const plan = generateNutritionPlan(profile, preset);

  const handleApply = () => {
    onApplyPlan(profile, plan.goals);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border border-slate-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Calculator className="w-3.5 h-3.5" />
              <span>Ecuación Mifflin-St Jeor</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Calculadora de TDEE y Macronutrientes
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Calcula tu gasto energético diario real y obtén la proporción óptima de proteínas,
              carbohidratos y grasas según tu objetivo corporal.
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
            <span className="text-[11px] text-slate-400 font-medium">Meta Recomendada</span>
            <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              {plan.goals.calories} <span className="text-xs text-slate-300 font-normal">kcal/día</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-4 rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-emerald-400" />
            <span>Datos Biométricos y Nivel de Actividad</span>
          </h3>

          {/* Biological Sex */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sexo Biológico</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProfile({ ...profile, gender: 'male' })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  profile.gender === 'male'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>Hombre ♂️</span>
              </button>
              <button
                type="button"
                onClick={() => setProfile({ ...profile, gender: 'female' })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  profile.gender === 'female'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>Mujer ♀️</span>
              </button>
            </div>
          </div>

          {/* Age, Weight, Height */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Edad (años)</label>
              <input
                type="number"
                min="14"
                max="95"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Peso (kg)</label>
              <input
                type="number"
                step="0.5"
                min="35"
                max="250"
                value={profile.weightKg}
                onChange={(e) => setProfile({ ...profile, weightKg: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Altura (cm)</label>
              <input
                type="number"
                min="120"
                max="230"
                value={profile.heightCm}
                onChange={(e) => setProfile({ ...profile, heightCm: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Activity Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nivel de Actividad Semanal</span>
            </label>
            <div className="space-y-1.5">
              {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => {
                const item = ACTIVITY_LABELS[level];
                const isSelected = profile.activityLevel === level;
                return (
                  <div
                    key={level}
                    onClick={() => setProfile({ ...profile, activityLevel: level })}
                    className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500'
                        : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{item.label}</div>
                      <div className="text-[11px] text-slate-400">{item.desc}</div>
                    </div>
                    <div className="text-xs font-mono font-bold text-emerald-400">
                      x{ACTIVITY_LABELS[level] ? level : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Goal Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>Objetivo Nutricional</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(GOAL_ADJUSTMENTS) as Goal[]).map((goalKey) => {
                const item = GOAL_ADJUSTMENTS[goalKey];
                const isSelected = profile.goal === goalKey;
                return (
                  <div
                    key={goalKey}
                    onClick={() => setProfile({ ...profile, goal: goalKey })}
                    className={`p-2.5 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500'
                        : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{item.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results & Macro Split Customization (5 cols) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Energy Summary Card */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-emerald-400" />
                <span>Desglose Energético</span>
              </h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <span className="text-xs font-semibold text-slate-200">Metabolismo Basal (BMR)</span>
                    <p className="text-[10px] text-slate-400">Calorías en reposo absoluto</p>
                  </div>
                  <span className="text-sm font-extrabold text-white font-mono">{plan.bmr} kcal</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <span className="text-xs font-semibold text-slate-200">Gasto Total Diario (TDEE)</span>
                    <p className="text-[10px] text-slate-400">Con tu actividad física actual</p>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-400 font-mono">{plan.tdee} kcal</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-950 border border-emerald-500/40">
                  <div>
                    <span className="text-xs font-bold text-emerald-300">Calorías Meta ({GOAL_ADJUSTMENTS[profile.goal].label})</span>
                    <p className="text-[10px] text-slate-400">Para lograr tu objetivo corporal</p>
                  </div>
                  <span className="text-lg font-black text-white font-mono">{plan.goals.calories} kcal</span>
                </div>
              </div>
            </div>

            {/* Macro Distribution Presets */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>Distribución de Macronutrientes</span>
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(PRESET_RATIOS) as Array<Exclude<MacroDistributionPreset, 'custom'>>).map(
                  (pKey) => {
                    const presetInfo = PRESET_RATIOS[pKey];
                    const isSelected = preset === pKey;
                    return (
                      <button
                        key={pKey}
                        type="button"
                        onClick={() => setPreset(pKey)}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500'
                            : 'bg-slate-950 border-slate-800 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="text-xs font-bold text-white">{presetInfo.name}</div>
                        <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                          {presetInfo.desc}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>

              {/* Macro Grams Outcome */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50 border border-slate-800/70 text-xs">
                  <div className="flex items-center gap-2">
                    <Beef className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-semibold text-slate-300">Proteína</span>
                  </div>
                  <div className="font-mono">
                    <span className="font-extrabold text-white">{plan.goals.proteinGrams}g</span>
                    <span className="text-[10px] text-slate-500 ml-1.5">
                      ({((plan.goals.proteinGrams / profile.weightKg) || 0).toFixed(1)} g/kg)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50 border border-slate-800/70 text-xs">
                  <div className="flex items-center gap-2">
                    <Wheat className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold text-slate-300">Carbohidratos</span>
                  </div>
                  <div className="font-mono">
                    <span className="font-extrabold text-white">{plan.goals.carbsGrams}g</span>
                    <span className="text-[10px] text-slate-500 ml-1.5">
                      ({Math.round((plan.goals.carbsGrams * 4 / plan.goals.calories) * 100)}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50 border border-slate-800/70 text-xs">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-3.5 h-3.5 text-rose-400" />
                    <span className="font-semibold text-slate-300">Grasas Saludables</span>
                  </div>
                  <div className="font-mono">
                    <span className="font-extrabold text-white">{plan.goals.fatGrams}g</span>
                    <span className="text-[10px] text-slate-500 ml-1.5">
                      ({Math.round((plan.goals.fatGrams * 9 / plan.goals.calories) * 100)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button: Apply and sync to tracker */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleApply}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition active:scale-[0.98]"
            >
              {justSaved ? (
                <>
                  <CheckCircle className="w-4 h-4 text-slate-950" />
                  <span>¡Metas Actualizadas con Éxito!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Aplicar a Mis Metas Diarias</span>
                </>
              )}
            </button>

            {justSaved && (
              <button
                onClick={onGoToTracker}
                className="w-full text-center text-xs font-semibold text-emerald-400 hover:underline py-1"
              >
                Ir al Diario de Macros para registrar comidas →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
