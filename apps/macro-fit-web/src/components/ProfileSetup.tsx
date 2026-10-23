import { FormEvent, useState } from 'react';
import { MacroGoals, UserProfile, profileSchema } from '../types/nutrition';
import {
  ACTIVITY_LABELS,
  GOAL_ADJUSTMENTS,
  generateNutritionPlan,
} from '../utils/calculator';

export function ProfileSetup({
  userName,
  onSave,
}: {
  userName: string;
  onSave: (profile: UserProfile, goals: MacroGoals) => Promise<boolean>;
}) {
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = profileSchema.safeParse({
      name: data.get('name'),
      age: Number(data.get('age')),
      gender: data.get('gender'),
      weightKg: Number(data.get('weightKg')),
      heightCm: Number(data.get('heightCm')),
      activityLevel: data.get('activityLevel'),
      goal: data.get('goal'),
    });
    if (!parsed.success) {
      setError('Completa tus datos con valores válidos.');
      return;
    }
    const plan = generateNutritionPlan(parsed.data, 'balanced');
    if (!(await onSave(parsed.data, plan.goals)))
      setError(
        'No se pudo confirmar el guardado. Revisa la conexión y actualiza los registros.'
      );
  }
  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold">Configura tu perfil</h2>
        <p className="mt-2 text-sm text-slate-400">
          Todavía no tienes metas guardadas. Ingresa tus datos para calcularlas
          y comenzar tu diario.
        </p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">
          Nombre
          <input
            name="name"
            defaultValue={userName}
            required
            maxLength={150}
            className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 p-2"
          />
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              ['age', 'Edad', 14, 120, 1],
              ['weightKg', 'Peso (kg)', 20, 500, 0.1],
              ['heightCm', 'Altura (cm)', 80, 300, 0.1],
            ] as const
          ).map(([name, label, min, max, step]) => (
            <label key={name} className="block text-sm">
              {label}
              <input
                name={name}
                type="number"
                required
                min={min}
                max={max}
                step={step}
                className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 p-2"
              />
            </label>
          ))}
        </div>
        <label className="block text-sm">
          Sexo biológico
          <select
            name="gender"
            defaultValue=""
            required
            className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 p-2"
          >
            <option value="" disabled>
              Selecciona una opción
            </option>
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
          </select>
        </label>
        <label className="block text-sm">
          Actividad física
          <select
            name="activityLevel"
            defaultValue=""
            required
            className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 p-2"
          >
            <option value="" disabled>
              Selecciona tu nivel
            </option>
            {Object.entries(ACTIVITY_LABELS).map(([value, item]) => (
              <option key={value} value={value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Objetivo
          <select
            name="goal"
            defaultValue=""
            required
            className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 p-2"
          >
            <option value="" disabled>
              Selecciona tu objetivo
            </option>
            {Object.entries(GOAL_ADJUSTMENTS)
              .filter(([value]) => value !== 'meds_pauta')
              .map(([value, item]) => (
                <option key={value} value={value}>
                  {item.label}
                </option>
              ))}
          </select>
        </label>
        {error && (
          <p role="alert" className="text-sm text-rose-300">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="w-full rounded-xl bg-emerald-400 p-3 font-bold text-slate-950"
        >
          Calcular y guardar mis metas
        </button>
      </form>
    </section>
  );
}
