import { EquivalenceSuggestions } from '@project-manager/macrofit-contracts';
import { EquivalenceProposalFood } from '../plate-analysis/dto/equivalence-proposal.dto';

const source = {
  title: 'UCLA Health · Basic Nutrition · Free Foods',
  url: 'https://www.uclahealth.org/medical-services/endocrinology/diabetes/type-2-diabetes/basic-nutrition',
};
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// A reviewed general reference, not a rule attributed to the user's dietitian.
// Narrow identity + label checks prevent applying it to honey mustard, seeds,
// mayonnaise or a sauce whose formula is unknown. No inference from calories alone.
export function condimentReference(
  food: EquivalenceProposalFood
): EquivalenceSuggestions['suggestions'][number] | undefined {
  const brand = normalize(food.brand ?? '');
  const name = normalize(food.name)
    .split(' ')
    .filter((word) => !brand.split(' ').includes(word))
    .join(' ');
  if (
    ![
      'mostaza',
      'mostaza tradicional',
      'mostaza amarilla',
      'yellow mustard',
      'mustard',
    ].includes(name) ||
    (food.quantityUnit ?? 'g') !== 'g' ||
    !food.servingSizeGrams ||
    ![food.calories, food.protein, food.carbs, food.fat].every(
      (value) =>
        typeof value === 'number' && Number.isFinite(value) && value >= 0
    )
  )
    return;
  const per100 = (value: number) => (value * 100) / food.servingSizeGrams!;
  // Compatibility guards for this reference, not universal nutrition thresholds.
  if (
    per100(food.calories!) > 100 ||
    per100(food.carbs!) > 10 ||
    per100(food.fat!) > 5
  )
    return;
  const assumptions = [
    'Es mostaza tradicional, sin miel ni mezcla con mayonesa; comprueba los ingredientes.',
    'Se usa como condimento. Sin sumar intercambios no significa consumo ilimitado ni ausencia de calorías o sodio.',
    'Es una propuesta general; tu pauta personal no declara esta equivalencia.',
  ];
  return {
    key: 'reference:mustard',
    origin: 'estimate',
    match: 'estimated',
    confidence: 'medium',
    explanation:
      'La referencia general incluye la mostaza entre los condimentos libres. Por su identidad y la ficha guardada, se propone registrarla sin sumar porciones de intercambio, conservando sus calorías y macros.',
    uncertainty:
      'La fuente es educación nutricional general para diabetes; no confirma una equivalencia de tu pauta ni de esta marca. Revisa el criterio antes de aceptarlo.',
    evidence: { method: 'reference', assumptions, sources: [source] },
    rule: {
      id: 'proposed-condiment',
      name: food.name,
      foodIds: [food.id],
      aliases: [],
      referenceAmount: food.servingSizeGrams,
      unit: 'g',
      free: true,
      contributions: [],
      notes: `Propuesta orientativa: condimento sin sumar intercambios; calorías y macros se mantienen. No incluida en la pauta original. ${assumptions.join(
        ' '
      )} Fuente general: ${source.title}. ${source.url}`,
    },
  };
}
