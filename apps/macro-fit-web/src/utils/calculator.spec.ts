import { generateNutritionPlan, MEDS_PAUTA_GOALS } from './calculator';
import { UserProfile } from '../types/nutrition';

it('calculates personal goals without assigning clinical portions unless the preset is explicitly selected', () => {
  const profile: UserProfile = {
    name: 'Persona',
    age: 34,
    gender: 'male',
    weightKg: 72,
    heightCm: 170,
    activityLevel: 'moderate',
    goal: 'maintenance',
  };
  const plan = generateNutritionPlan(profile);
  expect(plan.goals.calories).toBe(2508);
  expect(plan.goals.distributionPreset).toBe('balanced');
  expect(plan.goals.pautaPortions).toBeUndefined();
  expect(generateNutritionPlan(profile, 'meds_pauta').goals).toEqual(
    MEDS_PAUTA_GOALS
  );
});
