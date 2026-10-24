import {
  NutritionPlanInput,
  PautaGroup,
  PautaRule,
  QuantityUnit,
} from './nutrition';

export interface NutritionTemplateEntry {
  section: string;
  /** Source table/row, excluding headers, for auditing the development reference. */
  source: string;
  householdMeasure: string;
  rule: PautaRule;
}
export interface NutritionPlanTemplate {
  id: string;
  version: number;
  name: string;
  description: string;
  reviewNotes: string[];
  /** Older base rules consolidated into an entry in this version. */
  legacyRuleIds: string[];
  entries: NutritionTemplateEntry[];
  defaults: Omit<NutritionPlanInput, 'startsOn' | 'rules'>;
}

// Exchange references only. Group-average nutrients in the document are NOT
// product nutrition facts and must never be used to populate the food catalog.
const entries: NutritionTemplateEntry[] = [];
function add(
  source: string,
  section: string,
  id: string,
  names: string[],
  amount: number,
  measure: string,
  group: PautaGroup,
  options: {
    unit?: QuantityUnit;
    foodIds?: string[];
    aliases?: string[];
    notes?: string;
    secondaryCarbs?: boolean;
    portions?: number;
    free?: boolean;
  } = {}
) {
  entries.push({
    source,
    section,
    householdMeasure: measure,
    rule: {
      id,
      name: names.join(' / '),
      foodIds: options.foodIds ?? (id.startsWith('meds-') ? [id] : []),
      aliases: [...new Set([...names, ...(options.aliases ?? [])])],
      referenceAmount: amount,
      unit: options.unit ?? 'g',
      free: options.free ?? false,
      contributions: options.free
        ? []
        : [
            { group, portions: options.portions ?? 1 },
            ...(options.secondaryCarbs
              ? [{ group: 'carbs' as const, portions: 0.5 }]
              : []),
          ],
      notes: [
        measure ? `Medida casera de referencia: ${measure}.` : '',
        options.notes ?? '',
      ]
        .filter(Boolean)
        .join(' '),
    },
  });
}
const cooked = 'Peso cocido, listo para servir.';
const low = 'Proteínas · bajas en grasa';
const high = 'Proteínas · altas en grasa';
const protein = (
  row: number,
  id: string,
  names: string[],
  amount: number,
  measure: string,
  aliases: string[] = []
) =>
  add(`65:${row}`, low, id, names, amount, measure, 'protein', {
    aliases,
    notes: cooked,
  });
protein(
  2,
  'meds-carne-vacuno-magra',
  [
    'Filete de vacuno',
    'Asiento picana',
    'Lomo liso',
    'Pollo ganso',
    'Posta rosada',
    'Posta negra',
    'Abastero',
  ],
  50,
  '1 trozo de 6 × 6 × 1 cm',
  ['Carne de vacuno magra cocida']
);
protein(
  3,
  'meds-carne-molida-magra',
  ['Carne molida (<5% grasa)'],
  50,
  '¼ taza'
);
protein(
  4,
  'ref-cerdo-magro',
  ['Solomillo de cerdo', 'Filete de cerdo', 'Lomo de cerdo'],
  50,
  '1 trozo de 6 × 6 × 1 cm'
);
protein(
  5,
  'meds-pechuga-pollo',
  [
    'Pechuga de pollo sin piel',
    'Truto de pollo sin piel',
    'Pechuga de pavo sin piel',
    'Truto de pavo sin piel',
  ],
  50,
  '1 trozo de 6 × 6 × 1 cm',
  ['Pollo cocido', 'Pechuga de pollo cocida', 'Pechuga de pollo a la plancha']
);
protein(
  6,
  'meds-jamon-pavo',
  ['Jamón de pavo', 'Jamón de pollo'],
  60,
  '3 rebanadas'
);
protein(
  7,
  'meds-reineta-pescado',
  [
    'Reineta',
    'Congrio',
    'Corvina',
    'Jurel fresco',
    'Lenguado',
    'Merluza',
    'Pejegallo',
  ],
  80,
  '1 trozo de 10 × 6 × 1 cm'
);
protein(
  8,
  'meds-atun-al-agua',
  ['Atún en lata al agua', 'Jurel en lata al agua', 'Salmón en lata al agua'],
  60,
  '⅓ taza'
);
protein(9, 'ref-moluscos', ['Almejas', 'Choritos', 'Ostras'], 60, '7 unidades');
protein(10, 'meds-camarones', ['Camarones'], 120, '20 unidades');
protein(11, 'ref-calamar-pulpo', ['Calamares', 'Pulpo'], 80, '');
protein(12, 'ref-jaiba', ['Jaiba'], 60, '3 cucharadas');
protein(13, 'ref-locos', ['Locos'], 60, '1 unidad');
protein(14, 'ref-cholga', ['Cholga'], 80, '8 unidades');
protein(15, 'ref-machas', ['Machas'], 50, '5 unidades');
protein(16, 'ref-piure', ['Piure'], 120, '12 unidades');
for (const [row, id, names, amount, measure] of [
  [2, 'ref-molida-grasa', ['Carne molida (alta en grasa)'], 50, '½ taza'],
  [3, 'ref-cordero', ['Cordero'], 50, '1 trozo de 6 × 6 × 1 cm'],
  [
    4,
    'meds-salmon',
    ['Salmón fresco', 'Cojinova', 'Trucha', 'Mero', 'Sierra', 'Bonito'],
    80,
    '1 trozo de 10 × 6 × 1 cm',
  ],
  [
    5,
    'ref-conserva-aceite',
    [
      'Atún en lata en aceite',
      'Jurel en lata en aceite',
      'Sardinas en lata en aceite',
    ],
    50,
    '⅓ taza',
  ],
  [
    6,
    'ref-vacuno-graso',
    ['Lomo vetado', 'Plateada'],
    50,
    '1 trozo de 6 × 6 × 1 cm',
  ],
] as const)
  add(`67:${row}`, high, id, [...names], amount, measure, 'protein', {
    notes: `${cooked} La tabla asigna una porción de proteína; no añade una porción de grasa.`,
  });
add(
  '69:2',
  'Proteínas · huevo',
  'meds-claras-huevo',
  ['Clara de huevo'],
  100,
  '3 claras',
  'protein'
);
add(
  '69:3',
  'Proteínas · huevo',
  'meds-huevo-entero',
  ['Huevo entero'],
  75,
  '1 huevo',
  'protein'
);
add(
  '72:2',
  'Proteínas · vegetales',
  'ref-soya-cruda',
  ['Carne de soya cruda'],
  25,
  '¼ taza',
  'protein',
  { notes: 'Peso en crudo; no intercambiar con el peso cocido.' }
);
add(
  '72:2',
  'Proteínas · vegetales',
  'ref-soya-cocida',
  ['Carne de soya cocida'],
  50,
  '¾ taza',
  'protein',
  { notes: cooked }
);
add(
  '72:3',
  'Proteínas · vegetales',
  'ref-seitan-tofu',
  ['Seitán', 'Tofu'],
  50,
  '',
  'protein',
  { notes: cooked }
);
add(
  '72:4',
  'Proteínas · vegetales',
  'ref-tempeh',
  ['Tempeh'],
  30,
  '',
  'protein',
  { notes: cooked }
);
const legume = (
  source: string,
  id: string,
  names: string[],
  amount: number,
  measure: string,
  notes: string
) =>
  add(
    source,
    'Legumbres · proteína + carbohidrato',
    id,
    names,
    amount,
    measure,
    'protein',
    { notes, secondaryCarbs: true }
  );
legume(
  '76:2',
  'ref-habas-cocidas',
  ['Habas cocidas (legumbre seca)'],
  140,
  '¾ taza',
  cooked
);
legume(
  '76:3',
  'ref-porotos-granados',
  ['Porotos granados cocidos'],
  120,
  '¾ taza',
  cooked
);
legume(
  '76:4',
  'meds-legumbres-cocidas',
  [
    'Lentejas cocidas',
    'Arvejas cocidas (legumbre seca)',
    'Porotos cocidos',
    'Garbanzos cocidos',
  ],
  140,
  '¾ taza',
  cooked
);
legume(
  '76:5',
  'ref-pasta-legumbres',
  ['Tallarines de legumbres cocidos'],
  100,
  '¾ taza',
  cooked
);
legume(
  '76:6',
  'ref-hamburguesa-legumbres',
  ['Hamburguesa de legumbres'],
  100,
  '1 unidad',
  cooked
);
legume(
  '76:7',
  'ref-harina-legumbres',
  ['Harina cruda de legumbres', 'Harina precocida de legumbres'],
  50,
  '⅓ taza',
  'La fila especifica harina cruda y precocida aunque aparece bajo el encabezado «Cocidas»; conservar esa distinción.'
);
legume(
  '78:2',
  'ref-habas-crudas',
  ['Habas crudas (legumbre seca)'],
  50,
  '¼ taza',
  'Peso en crudo; no corresponde a habas frescas.'
);
legume(
  '78:3',
  'ref-legumbres-crudas',
  [
    'Lentejas crudas',
    'Arvejas crudas (legumbre seca)',
    'Porotos crudos',
    'Garbanzos crudos',
  ],
  50,
  '¼ taza',
  'Peso en crudo; no corresponde a arvejas frescas.'
);
const dairy = (
  row: number,
  id: string,
  names: string[],
  amount: number,
  measure: string,
  unit: QuantityUnit = 'g',
  notes = ''
) =>
  add(`83:${row}`, 'Lácteos', id, names, amount, measure, 'dairy', {
    unit,
    notes,
  });
dairy(
  2,
  'meds-leche-descremada',
  ['Leche descremada', 'Leche semidescremada'],
  200,
  '1 taza',
  'ml',
  'No se convierte volumen a gramos.'
);
dairy(
  3,
  'ref-leche-cultivada',
  ['Leche cultivada descremada'],
  200,
  '1 taza',
  'ml'
);
dairy(4, 'ref-leche-polvo', ['Leche en polvo descremada'], 20, '2 cucharadas');
dairy(5, 'meds-yogurt-descremado', ['Yogurt descremado'], 125, '1 unidad');
dairy(
  6,
  'meds-yogurt-proteico',
  ['Yogurt proteico'],
  1,
  '1 unidad',
  'unit',
  'La tabla no declara gramos por envase. Indica unidades o define el peso de tu producto.'
);
dairy(
  7,
  'meds-quesillo-light',
  ['Quesillo light (rodaja de 3 cm)', 'Queso fresco light'],
  60,
  'Rodaja de 3 cm',
  'g',
  'La tabla también ofrece quesillo light de 90 g; elige la referencia correspondiente.'
);
dairy(
  8,
  'ref-quesillo-90',
  ['Quesillo light (rodaja de 4 cm)'],
  90,
  'Rodaja de 4 cm',
  'g',
  'Referencia alternativa a los 60 g de la otra fila.'
);
// The source gives two different weights for this name: exact-name matching stays ambiguous.
for (const entry of entries.filter((entry) =>
  ['83:7', '83:8'].includes(entry.source)
))
  entry.rule.aliases.push('Quesillo light');
dairy(9, 'meds-queso-cottage', ['Queso cottage'], 80, '4 cucharadas');
dairy(10, 'ref-ricotta', ['Ricotta light'], 65, '3 cucharadas');
for (const [row, id, names, amount, measure] of [
  [
    2,
    'meds-aceite-oliva',
    [
      'Aceite de oliva',
      'Aceite de canola',
      'Aceite de maravilla',
      'Aceite de pepita de uva',
      'Aceite de chía',
      'Aceite de nuez',
    ],
    20,
    '4 cucharaditas',
  ],
  [3, 'ref-margarina', ['Margarina light'], 60, '4 cucharaditas'],
  [4, 'meds-aceitunas', ['Aceitunas sin cuesco'], 90, '11 unidades'],
  [5, 'meds-nueces', ['Nueces'], 30, '5 unidades'],
  [6, 'meds-almendras', ['Almendras'], 24, '24 unidades'],
  [7, 'ref-pistacho', ['Pistacho'], 24, '40 unidades'],
  [8, 'ref-avellanas-chilenas', ['Avellanas chilenas'], 20, '28 unidades'],
  [9, 'ref-avellanas-europeas', ['Avellanas europeas'], 36, '12 unidades'],
  [10, 'ref-caju', ['Castañas de cajú'], 30, '14 unidades'],
  [11, 'meds-palta-hass', ['Palta'], 90, '3 cucharadas'],
  [
    12,
    'meds-mantequilla-mani',
    ['Mantequilla de maní', 'Mantequilla de almendras'],
    32,
    '2 cucharaditas',
  ],
  [
    13,
    'ref-semillas-sesamo',
    ['Semilla de sésamo', 'Semilla de maravilla', 'Semilla de girasol'],
    30,
    '3 cucharadas',
  ],
  [
    14,
    'ref-semillas-chia',
    ['Semilla de chía', 'Semilla de linaza'],
    46,
    '4 cucharadas',
  ],
] as const)
  add(`86:${row}`, 'Grasas', id, [...names], amount, measure, 'fats', {
    unit: row === 2 ? 'ml' : 'g',
    aliases: row === 11 ? ['Aguacate'] : [],
    notes:
      row === 12
        ? 'Se conserva la medida casera escrita en la tabla; usar el peso de 32 g para el cálculo.'
        : '',
  });
for (const [row, id, names, amount, measure] of [
  [
    2,
    'meds-pan-marraqueta',
    ['Marraqueta', 'Hallulla', 'Ciabatta'],
    50,
    '½ unidad',
  ],
  [3, 'ref-molde-blanco', ['Pan molde blanco'], 60, '2 rebanadas'],
  [4, 'meds-pan-molde-integral', ['Pan molde integral'], 50, '2 rebanadas'],
  [
    5,
    'meds-pan-pita',
    ['Pan pita blanco', 'Pan pita integral'],
    60,
    '1½ unidades',
  ],
  [6, 'ref-pan-centeno', ['Pan centeno'], 50, '2 rebanadas'],
  [7, 'ref-pumpernickel', ['Pan pumpernickel'], 75, '1¼ unidades'],
  [
    8,
    'meds-fajitas-tortillas',
    [
      'Tortillas pequeñas o medianas (S/M)',
      'Fajitas pequeñas o medianas (S/M)',
    ],
    50,
    '2 unidades',
  ],
  [
    9,
    'ref-wrap',
    ['Tortillas grandes (L)', 'Fajitas grandes (L)', 'Burrito', 'Wrap'],
    50,
    '1 unidad',
  ],
] as const)
  add(
    `90:${row}`,
    'Carbohidratos · panes',
    id,
    [...names],
    amount,
    measure,
    'carbs'
  );
for (const [row, id, name, amount, measure] of [
  [
    2,
    'ref-galletas-agua',
    'Galletas de agua / Galletas de soda',
    40,
    '7 unidades',
  ],
  [3, 'ref-galletas-chuno', 'Galletas de chuño', 40, '5 unidades'],
  [4, 'meds-galletas-arroz', 'Galletas de arroz grandes', 35, '5 unidades'],
  [5, 'meds-galletas-salmas', 'Galletas salmas', 36, '6 unidades'],
  [6, 'ref-crackelet', 'Galletas crackelet', 10, '10 unidades'],
  [
    9,
    'ref-harinas',
    'Harina de trigo / Maicena / Chuño / Harina tostada',
    40,
    '4 cucharadas',
  ],
  [10, 'ref-semola', 'Sémola', 40, '3 cucharadas'],
] as const)
  add(
    `92:${row}`,
    row < 7 ? 'Carbohidratos · galletas' : 'Carbohidratos · harinas',
    id,
    name.split(' / '),
    amount,
    measure,
    'carbs',
    {
      unit: row === 6 ? 'unit' : 'g',
      notes:
        row === 6
          ? 'La tabla no indica peso en gramos. Se cuentan unidades.'
          : row === 4
          ? 'La tabla indica 5 galletas = 1 porción; el ejemplo de 10 galletas y 5 porciones es contradictorio.'
          : '',
    }
  );
for (const [row, id, name, amount, measure] of [
  [2, 'ref-cereal-sin-azucar', 'Cereales sin azúcar', 40, '1 taza'],
  [3, 'ref-cereal-fibra', 'Cereales sin azúcar altos en fibra', 50, '1¼ taza'],
  [4, 'ref-hojuelas-maiz', 'Hojuelas de maíz', 40, '1 taza'],
  [5, 'meds-avena', 'Avena', 40, '½ taza'],
  [6, 'ref-granola', 'Granola', 30, '⅓ taza'],
  [
    7,
    'ref-barra-cereal-azucar',
    'Barra de cereal con azúcar',
    40,
    '1½ unidades',
  ],
  [
    8,
    'ref-barra-cereal-sin-azucar',
    'Barra de cereal sin azúcar',
    40,
    '2 unidades',
  ],
] as const)
  add(
    `94:${row}`,
    'Carbohidratos · cereales de desayuno',
    id,
    [name],
    amount,
    measure,
    'carbs',
    { notes: 'Peso seco del producto.' }
  );
for (const [row, id, name, amount, measure] of [
  [2, 'meds-arroz-cocido', 'Arroz blanco cocido', 110, '¾ taza'],
  [3, 'meds-arroz-integral', 'Arroz integral cocido', 120, '¾ taza'],
  [4, 'meds-fideos-cocidos', 'Fideos cocidos', 110, '¾ taza'],
  [5, 'ref-fideos-arroz', 'Fideos de arroz cocidos', 130, '¾ taza'],
  [6, 'meds-choclo-cocido', 'Choclo cocido', 130, '¾ taza'],
  [7, 'meds-quinoa-cocida', 'Quinoa cocida', 110, '¾ taza'],
  [8, 'ref-mote', 'Mote cocido', 120, '¾ taza'],
  [9, 'ref-cabritas', 'Cabritas', 35, '1½ taza'],
] as const)
  add(
    `96:${row}`,
    'Carbohidratos · cereales y pastas',
    id,
    [name],
    amount,
    measure,
    'carbs',
    {
      notes: cooked,
      aliases: row === 2 ? ['Arroz cocido'] : row === 4 ? ['Pasta cocida'] : [],
    }
  );
for (const [row, id, name, amount, measure] of [
  [2, 'meds-papa-cocida', 'Papa cocida', 150, '1 unidad regular'],
  [3, 'meds-camote', 'Camote cocido', 120, '½ taza'],
  [4, 'ref-yuca', 'Yuca cocida', 120, '½ taza'],
] as const)
  add(
    `98:${row}`,
    'Carbohidratos · tubérculos',
    id,
    [name],
    amount,
    measure,
    'carbs',
    { notes: cooked }
  );
add(
  '100:2',
  'Carbohidratos · legumbres frescas',
  'ref-habas-frescas',
  ['Habas frescas'],
  112,
  '¾ taza',
  'carbs',
  {
    notes:
      'Fila de legumbres frescas; no usar la equivalencia de legumbres secas.',
  }
);
add(
  '100:3',
  'Carbohidratos · legumbres frescas',
  'ref-arvejas-frescas',
  ['Arvejas frescas'],
  180,
  '1 taza',
  'carbs',
  {
    notes:
      'Fila de legumbres frescas; no usar la equivalencia de legumbres secas.',
  }
);
for (const [row, id, names, amount, measure] of [
  [2, 'ref-cerezas', ['Cerezas'], 90, '15 unidades'],
  [3, 'ref-chirimoya', ['Chirimoya'], 90, '¼ unidad'],
  [4, 'ref-ciruelas-damascos', ['Ciruelas', 'Damascos'], 120, '3 unidades'],
  [
    5,
    'meds-manzana',
    ['Durazno', 'Manzana', 'Pera', 'Naranja'],
    100,
    '1 unidad',
  ],
  [
    6,
    'meds-arandanos',
    ['Frambuesas', 'Moras', 'Arándanos'],
    1,
    '1 taza (120–130 g)',
  ],
  [7, 'meds-frutillas', ['Frutillas'], 200, '1 taza'],
  [8, 'meds-kiwi', ['Kiwi', 'Tuna'], 100, '2 unidades'],
  [9, 'meds-melon-sandia', ['Melón', 'Sandía'], 200, '1 taza'],
  [10, 'ref-pina', ['Piña'], 120, '¾ taza'],
  [11, 'ref-mango', ['Mango'], 100, '½ unidad'],
  [12, 'meds-platano', ['Plátano'], 60, '½ unidad'],
] as const)
  add(`105:${row}`, 'Frutas', id, [...names], amount, measure, 'fruits', {
    unit: row === 6 ? 'cup' : 'g',
    foodIds: row === 5 ? ['meds-manzana', 'meds-naranja'] : undefined,
    notes:
      row === 6
        ? 'El documento da un rango de 120–130 g, no un peso exacto. Indica tazas al clasificar; no hay conversión automática desde gramos.'
        : '',
  });
const freeVegetables = [
  'Ajo',
  'Cebolla',
  'Cebollín',
  'Puerro',
  'Apio',
  'Penca',
  'Lechuga',
  'Repollo',
  'Acelga',
  'Espinaca',
  'Rúcula',
  'Kale',
  'Endivias',
  'Albahaca',
  'Achicoria',
  'Berro',
  'Perejil',
  'Pepino',
  'Pimentón',
  'Zapallo italiano crudo',
  'Rabanito',
];
freeVegetables.forEach((name, index) =>
  add(
    '109:2:libres',
    'Verduras · libre consumo',
    `ref-verdura-libre-${index + 1}`,
    [name],
    1,
    'Libre consumo',
    'veggies',
    {
      free: true,
      unit: 'unit',
      notes:
        'Sin meta de porciones de verduras en esta plantilla. La tabla no declara un peso en gramos.',
    }
  )
);
// Preserve both household references where the document repeats an item.
for (const [index, names, measure] of [
  [
    1,
    [
      'Acelga cocida',
      'Berenjena',
      'Espinaca cocida',
      'Zapallo cocido',
      'Zanahoria cocida',
      'Betarraga cocida',
      'Coles de Bruselas',
    ],
    '½ taza',
  ],
  [
    2,
    [
      'Brócoli',
      'Coliflor',
      'Zanahoria cruda',
      'Zapallo italiano cocido',
      'Champiñones crudos',
      'Cebollín',
      'Berenjena cocida',
      'Zapallo',
      'Acelga cocida',
      'Betarraga cruda',
    ],
    '1 taza',
  ],
  [3, ['Porotos verdes', 'Champiñones cocidos'], '¾ taza'],
  [4, ['Espárragos'], '5 unidades'],
  [5, ['Tomate', 'Alcachofa'], '1 unidad'],
  [6, ['Pepinillos', 'Pickles'], '3 unidades'],
] as const)
  add(
    '109:2:generales',
    'Verduras · generales',
    `ref-verduras-generales-${index}`,
    [...names],
    1,
    measure,
    'veggies',
    {
      free: true,
      unit: 'unit',
      foodIds: index === 5 ? ['meds-tomate'] : [],
      notes:
        'Medida casera informativa; el objetivo diario de verduras es libre. No se inventa un peso en gramos.',
    }
  );
add(
  '109:2:libres',
  'Verduras · libre consumo',
  'meds-ensalada-verde',
  ['Ensalada verde'],
  1,
  'Libre consumo',
  'veggies',
  {
    free: true,
    unit: 'unit',
    notes:
      'Solo hojas y verduras de libre consumo de la tabla; no incluye aliños, palta ni otros ingredientes.',
  }
);
add(
  'P7',
  'Proteínas · suplementos y barras',
  'meds-scoop-proteina',
  ['Proteína en polvo (1 scoop)'],
  1,
  '1 scoop',
  'protein',
  {
    unit: 'scoop',
    portions: 2,
    aliases: ['Proteína Whey (1 Scoop)'],
    notes: 'Equivalencia explícita del documento. No declara gramos por scoop.',
  }
);
add(
  'P8',
  'Proteínas · suplementos y barras',
  'meds-barra-twenty',
  ['Barra de proteína Twenty'],
  1,
  '1 barra',
  'protein',
  { unit: 'unit', portions: 2 }
);
add(
  'P9',
  'Proteínas · suplementos y barras',
  'meds-barra-wild-protein',
  ['Barra Wild Protein'],
  1,
  '1 barra',
  'protein',
  { unit: 'unit', secondaryCarbs: true }
);

const base: NutritionPlanTemplate = {
  id: 'intercambios-julio-2026',
  version: 1,
  name: 'Pauta de intercambios · base julio 2026',
  description:
    'Tablas completas de alimentos, preparaciones y medidas caseras. Copia editable para comenzar tu propia pauta.',
  legacyRuleIds: ['meds-naranja'],
  reviewNotes: [
    'Las metas 10 / 4 / 2 / 3 / 3 pertenecen a la pauta de referencia; cada persona debe configurar las suyas. Agua: más de 2 litros.',
    'Pollo: la tabla usa 50 g cocidos por porción y un ejemplo dice 100 g. Se usa la tabla. Galletas de arroz: 5 unidades (35 g) por porción; otro ejemplo contiene un conteo contradictorio.',
    'Quesillo light aparece con 60 g y 90 g; ambas referencias están disponibles para elegir. Algunas verduras también tienen dos medidas caseras.',
    'Frambuesas, moras y arándanos: 1 taza (120–130 g). Se usa la taza, sin elegir un peso dentro del rango. Yogurt proteico, Crackelet y scoop se cuentan en sus unidades, sin inventar gramos.',
    'Las equivalencias no crean fichas de calorías o macros. Para esos datos usa una etiqueta o un producto verificado en Mis productos. La distribución de comidas del documento es solo un ejemplo.',
  ],
  entries,
  defaults: {
    name: 'Mi pauta de intercambios',
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
  },
};

/** Each caller receives an independent copy; applying a template never changes it. */
export function getNutritionPlanTemplates(): NutritionPlanTemplate[] {
  return structuredClone([base]);
}
export function createPautaTemplate(startsOn: string): NutritionPlanInput {
  return {
    ...structuredClone(base.defaults),
    startsOn,
    rules: structuredClone(entries.map((entry) => entry.rule)),
  };
}

export function importNutritionPlanTemplate(
  draft: NutritionPlanInput,
  template: NutritionPlanTemplate,
  options: { rules: 'merge' | 'replace'; includeTargets: boolean }
): NutritionPlanInput {
  const additions = template.entries.map((entry) => entry.rule);
  const templateIds = new Set([
    ...additions.map((rule) => rule.id),
    ...template.legacyRuleIds,
  ]);
  return structuredClone({
    ...draft,
    ...(options.includeTargets
      ? {
          targets: template.defaults.targets,
          waterTargetMl: template.defaults.waterTargetMl,
          waterIsMinimum: template.defaults.waterIsMinimum,
        }
      : {}),
    rules:
      options.rules === 'replace'
        ? additions
        : [
            ...draft.rules.filter((rule) => !templateIds.has(rule.id)),
            ...additions,
          ],
  });
}
