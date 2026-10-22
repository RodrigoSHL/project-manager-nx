import { MealTemplate } from '../types/nutrition';

export const DEFAULT_MEAL_TEMPLATES: MealTemplate[] = [
  // --- DESAYUNOS ---
  {
    id: 'template-desayuno-porridge',
    name: 'Porridge de Avena Proteico + Frutas & Chips',
    description: 'Avena (40g), Leche (200ml), 1 scoop Whey, Frutilla + Plátano, Chips cacao 60% (10g) y Café',
    mealType: 'breakfast',
    icon: '🥣',
    items: [
      { foodId: 'meds-avena', amountGrams: 40 },
      { foodId: 'meds-leche-descremada', amountGrams: 200 },
      { foodId: 'meds-scoop-proteina', amountGrams: 30 },
      { foodId: 'meds-frutillas', amountGrams: 100 },
      { foodId: 'meds-platano', amountGrams: 60 },
      { foodId: 'meds-chips-chocolate-60', amountGrams: 10 },
      { foodId: 'meds-cafe-negro', amountGrams: 200 },
    ],
  },
  {
    id: 'template-desayuno-porridge-arandanos',
    name: 'Porridge Proteico con Arándanos & Chips',
    description: 'Avena (40g), Leche (200ml), 1 scoop Whey, Arándanos (125g), Chips 60% (10g) y Café',
    mealType: 'breakfast',
    icon: '🫐',
    items: [
      { foodId: 'meds-avena', amountGrams: 40 },
      { foodId: 'meds-leche-descremada', amountGrams: 200 },
      { foodId: 'meds-scoop-proteina', amountGrams: 30 },
      { foodId: 'meds-arandanos', amountGrams: 125 },
      { foodId: 'meds-chips-chocolate-60', amountGrams: 10 },
      { foodId: 'meds-cafe-negro', amountGrams: 200 },
    ],
  },

  // --- ALMUERZOS ---
  {
    id: 'template-almuerzo-pollo-arroz',
    name: 'Almuerzo: Pollo a la Plancha (200g) + Arroz (50g) + Ensalada',
    description: 'Pechuga de pollo (200g), Arroz blanco cocido (50g), Ensalada mixta libre y Aceite de oliva (10ml)',
    mealType: 'lunch',
    icon: '🍗',
    items: [
      { foodId: 'meds-pechuga-pollo', amountGrams: 200 },
      { foodId: 'meds-arroz-cocido', amountGrams: 50 },
      { foodId: 'meds-ensalada-verde', amountGrams: 100 },
      { foodId: 'meds-aceite-oliva', amountGrams: 10 },
    ],
  },
  {
    id: 'template-almuerzo-vacuno-arroz',
    name: 'Almuerzo: Vacuno Magro (200g) + Arroz (50g) + Ensalada',
    description: 'Posta/Lomo liso cocido (200g), Arroz cocido (50g), Ensalada verde libre y Aceite de oliva (10ml)',
    mealType: 'lunch',
    icon: '🥩',
    items: [
      { foodId: 'meds-carne-vacuno-magra', amountGrams: 200 },
      { foodId: 'meds-arroz-cocido', amountGrams: 50 },
      { foodId: 'meds-ensalada-verde', amountGrams: 100 },
      { foodId: 'meds-aceite-oliva', amountGrams: 10 },
    ],
  },
  {
    id: 'template-almuerzo-atun-arroz',
    name: 'Almuerzo: Atún al Agua (120g) + Arroz (50g) + Ensalada',
    description: '2 latas de atún al agua escurrido (120g), Arroz (50g), Ensalada verde libre y Aceite de oliva (10ml)',
    mealType: 'lunch',
    icon: '🐟',
    items: [
      { foodId: 'meds-atun-al-agua', amountGrams: 120 },
      { foodId: 'meds-arroz-cocido', amountGrams: 50 },
      { foodId: 'meds-ensalada-verde', amountGrams: 100 },
      { foodId: 'meds-aceite-oliva', amountGrams: 10 },
    ],
  },

  // --- CENAS ---
  {
    id: 'template-cena-vacuno-fideos',
    name: 'Cena: Vacuno Magro (200g) + Fideos (50g) + Ensalada',
    description: 'Vacuno magro (200g), Fideos cocidos (50g), Ensalada verde libre y Aceite de oliva (10ml)',
    mealType: 'dinner',
    icon: '🌙',
    items: [
      { foodId: 'meds-carne-vacuno-magra', amountGrams: 200 },
      { foodId: 'meds-fideos-cocidos', amountGrams: 50 },
      { foodId: 'meds-ensalada-verde', amountGrams: 100 },
      { foodId: 'meds-aceite-oliva', amountGrams: 10 },
    ],
  },
  {
    id: 'template-cena-pollo-ensalada',
    name: 'Cena: Pechuga de Pollo (200g) + Papa (150g) + Ensalada',
    description: 'Pechuga de pollo (200g), Papa cocida (150g = 1 unidad), Ensalada verde libre y Aceite de oliva',
    mealType: 'dinner',
    icon: '🥔',
    items: [
      { foodId: 'meds-pechuga-pollo', amountGrams: 200 },
      { foodId: 'meds-papa-cocida', amountGrams: 150 },
      { foodId: 'meds-ensalada-verde', amountGrams: 100 },
      { foodId: 'meds-aceite-oliva', amountGrams: 10 },
    ],
  },

  // --- COLACIONES ---
  {
    id: 'template-colacion-protein-bite',
    name: 'Colación: Barra Protein Bite + Manzana',
    description: '1 Barra Protein Bite Your Goal (20g prot) + 1 Manzana (100g)',
    mealType: 'colacion_pm',
    icon: '🍫',
    items: [
      { foodId: 'meds-barra-yourgoal-protein-bite', amountGrams: 55 },
      { foodId: 'meds-manzana', amountGrams: 100 },
    ],
  },
];
