import { NutritionPlanInput, PautaGroup, PautaRule } from '../types/nutrition';
import { COMMON_FOODS } from './common-foods';

/** Editable reference from the supplied exchange tables, never activated automatically. */
export function createPautaTemplate(startsOn: string): NutritionPlanInput {
  const excluded = new Set([
    'meds-barra-yourgoal-protein-bite',
    'meds-chips-chocolate-60',
    'meds-arandanos',
    'meds-kiwi',
    'meds-melon-sandia',
  ]);
  const aliases: Record<string, string[]> = {
    'meds-pechuga-pollo': [
      'Pollo cocido',
      'Pechuga de pollo cocida',
      'Pechuga de pollo a la plancha',
    ],
    'meds-carne-vacuno-magra': ['Carne de vacuno magra cocida'],
    'meds-arroz-cocido': ['Arroz blanco cocido', 'Arroz cocido'],
    'meds-arroz-integral': ['Arroz integral cocido'],
    'meds-fideos-cocidos': ['Fideos cocidos', 'Pasta cocida'],
    'meds-palta-hass': ['Palta', 'Aguacate'],
    'meds-legumbres-cocidas': [
      'Lentejas cocidas',
      'Garbanzos cocidos',
      'Porotos cocidos',
    ],
    'meds-manzana': ['Manzana'],
    'meds-platano': ['Plátano'],
    'meds-naranja': ['Naranja'],
    'meds-frutillas': ['Frutillas'],
    'meds-avena': ['Avena'],
    'meds-barra-wild-protein': ['Barra Wild Protein'],
    'meds-leche-descremada': ['Leche descremada'],
    'meds-ensalada-verde': ['Ensalada verde'],
    'meds-tomate': ['Tomate'],
  };
  const rules: PautaRule[] = COMMON_FOODS.filter(
    (food) => food.portionEquiv && !excluded.has(food.id)
  ).map((food) => {
    const equiv = food.portionEquiv;
    if (!equiv) throw new Error('Equivalencia de referencia ausente');
    const nativeUnit = [
      'meds-scoop-proteina',
      'meds-barra-twenty',
      'meds-barra-wild-protein',
      'meds-yogurt-proteico',
    ].includes(food.id);
    const unit = nativeUnit
      ? food.id === 'meds-scoop-proteina'
        ? 'scoop'
        : 'unit'
      : ['meds-leche-descremada', 'meds-aceite-oliva'].includes(food.id)
      ? 'ml'
      : 'g';
    const free = equiv.group === 'veggies';
    return {
      id: food.id,
      name: food.name,
      foodIds: [food.id],
      aliases: aliases[food.id] ?? [],
      referenceAmount: nativeUnit ? 1 : food.servingSizeGrams,
      unit,
      contributions: free
        ? []
        : [
            { group: equiv.group as PautaGroup, portions: equiv.portions },
            ...(equiv.secondaryGroup && equiv.secondaryPortions
              ? [
                  {
                    group: equiv.secondaryGroup as PautaGroup,
                    portions: equiv.secondaryPortions,
                  },
                ]
              : []),
          ],
      free,
      notes:
        nativeUnit || unit === 'ml'
          ? 'Equivalencia por unidad o volumen. Indica esa cantidad; no se asume su peso en gramos.'
          : 'Referencia de la tabla. Carnes, arroz, pasta y papas se pesan cocidos; avena en seco.',
    };
  });
  return {
    name: 'Mi pauta nutricional',
    startsOn,
    enabled: true,
    targets: {
      protein: 10,
      carbs: 4,
      fats: 2,
      dairy: 3,
      fruits: 3,
      veggies: null,
      supplements: 0,
    },
    waterTargetMl: 2000,
    waterIsMinimum: true,
    rules,
  };
}
