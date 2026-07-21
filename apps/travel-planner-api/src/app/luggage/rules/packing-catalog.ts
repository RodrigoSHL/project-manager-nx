import { BaggagePolicy, PackMoment, PackingCategory, PackingPriority } from '../entities/packing-item.entity';

export interface PackingCatalogItemDefinition {
  id: string;
  name: string;
  category: PackingCategory;
  defaultWeight: number;
  priority: PackingPriority;
  cabinPolicy: BaggagePolicy;
  checkedPolicy: BaggagePolicy;
  packMoment: PackMoment;
  tags: string[];
}

const item = (
  id: string,
  name: string,
  category: PackingCategory,
  defaultWeight: number,
  priority: PackingPriority,
  tags: string[],
  overrides: Partial<Pick<PackingCatalogItemDefinition, 'cabinPolicy' | 'checkedPolicy' | 'packMoment'>> = {},
): PackingCatalogItemDefinition => ({
  id,
  name,
  category,
  defaultWeight,
  priority,
  tags,
  cabinPolicy: overrides.cabinPolicy ?? BaggagePolicy.ALLOWED,
  checkedPolicy: overrides.checkedPolicy ?? BaggagePolicy.ALLOWED,
  packMoment: overrides.packMoment ?? PackMoment.ADVANCE,
});

export const PACKING_CATALOG: PackingCatalogItemDefinition[] = [
  item('passport', 'Pasaporte y documentos', PackingCategory.DOCUMENTS, 0.12, PackingPriority.ESSENTIAL, ['base', 'personal'], { checkedPolicy: BaggagePolicy.PROHIBITED, packMoment: PackMoment.BEFORE_LEAVING }),
  item('wallet', 'Billetera y medios de pago', PackingCategory.MONEY, 0.18, PackingPriority.ESSENTIAL, ['base', 'personal'], { checkedPolicy: BaggagePolicy.PROHIBITED, packMoment: PackMoment.BEFORE_LEAVING }),
  item('phone', 'Teléfono', PackingCategory.TECHNOLOGY, 0.22, PackingPriority.ESSENTIAL, ['base', 'personal'], { checkedPolicy: BaggagePolicy.NOT_RECOMMENDED, packMoment: PackMoment.BEFORE_LEAVING }),
  item('charger', 'Cargador de teléfono', PackingCategory.TECHNOLOGY, 0.12, PackingPriority.ESSENTIAL, ['base', 'personal'], { checkedPolicy: BaggagePolicy.NOT_RECOMMENDED, packMoment: PackMoment.SAME_DAY }),
  item('adapter', 'Adaptador universal', PackingCategory.TECHNOLOGY, 0.16, PackingPriority.HIGH, ['base', 'personal', 'shared']),
  item('powerbank', 'Batería externa', PackingCategory.TECHNOLOGY, 0.3, PackingPriority.HIGH, ['personal'], { checkedPolicy: BaggagePolicy.PROHIBITED, packMoment: PackMoment.SAME_DAY }),
  item('medication', 'Medicamentos personales', PackingCategory.HEALTH, 0.18, PackingPriority.ESSENTIAL, ['medication', 'personal'], { checkedPolicy: BaggagePolicy.NOT_RECOMMENDED, packMoment: PackMoment.SAME_DAY }),
  item('first_aid', 'Botiquín básico', PackingCategory.HEALTH, 0.35, PackingPriority.HIGH, ['base', 'shared']),
  item('tshirt', 'Poleras', PackingCategory.TOPS, 0.18, PackingPriority.HIGH, ['clothing']),
  item('long_sleeve', 'Camiseta manga larga', PackingCategory.TOPS, 0.24, PackingPriority.NORMAL, ['cold', 'clothing']),
  item('pants', 'Pantalones', PackingCategory.BOTTOMS, 0.55, PackingPriority.HIGH, ['clothing']),
  item('shorts', 'Shorts', PackingCategory.BOTTOMS, 0.22, PackingPriority.NORMAL, ['hot', 'clothing']),
  item('underwear', 'Ropa interior', PackingCategory.UNDERWEAR, 0.07, PackingPriority.ESSENTIAL, ['clothing']),
  item('socks', 'Calcetines', PackingCategory.UNDERWEAR, 0.06, PackingPriority.ESSENTIAL, ['clothing']),
  item('sleepwear', 'Ropa para dormir', PackingCategory.UNDERWEAR, 0.3, PackingPriority.NORMAL, ['base', 'clothing']),
  item('light_jacket', 'Chaqueta liviana', PackingCategory.OUTERWEAR, 0.65, PackingPriority.HIGH, ['mild', 'rain', 'clothing']),
  item('warm_coat', 'Abrigo', PackingCategory.OUTERWEAR, 1.2, PackingPriority.HIGH, ['cold', 'snow', 'bulky']),
  item('rain_jacket', 'Chaqueta impermeable', PackingCategory.OUTERWEAR, 0.45, PackingPriority.HIGH, ['rain', 'hiking']),
  item('walking_shoes', 'Zapatillas cómodas', PackingCategory.FOOTWEAR, 0.8, PackingPriority.ESSENTIAL, ['base', 'bulky']),
  item('extra_shoes', 'Calzado alternativo', PackingCategory.FOOTWEAR, 0.75, PackingPriority.OPTIONAL, ['prepared', 'bulky']),
  item('toiletry_bag', 'Neceser', PackingCategory.HYGIENE, 0.45, PackingPriority.HIGH, ['base'], { cabinPolicy: BaggagePolicy.CHECK_AIRLINE }),
  item('toothbrush', 'Cepillo de dientes', PackingCategory.HYGIENE, 0.04, PackingPriority.ESSENTIAL, ['base', 'personal'], { packMoment: PackMoment.SAME_DAY }),
  item('sunscreen', 'Protector solar', PackingCategory.HYGIENE, 0.2, PackingPriority.HIGH, ['hot', 'beach', 'shared'], { cabinPolicy: BaggagePolicy.CHECK_AIRLINE }),
  item('umbrella', 'Paraguas compacto', PackingCategory.ACCESSORIES, 0.35, PackingPriority.NORMAL, ['rain', 'shared']),
  item('sunglasses', 'Lentes de sol', PackingCategory.ACCESSORIES, 0.05, PackingPriority.NORMAL, ['hot', 'base']),
  item('reusable_bottle', 'Botella reutilizable vacía', PackingCategory.ACCESSORIES, 0.18, PackingPriority.NORMAL, ['base', 'personal']),
  item('swimsuit', 'Traje de baño', PackingCategory.BEACH, 0.16, PackingPriority.HIGH, ['beach', 'hot']),
  item('running_outfit', 'Conjunto de running', PackingCategory.SPORT, 0.35, PackingPriority.NORMAL, ['running']),
  item('running_shoes', 'Zapatillas de running', PackingCategory.SPORT, 0.65, PackingPriority.NORMAL, ['running', 'bulky']),
  item('hiking_gear', 'Ropa de senderismo', PackingCategory.SPORT, 0.5, PackingPriority.NORMAL, ['hiking']),
  item('formal_outfit', 'Conjunto formal', PackingCategory.WORK, 0.9, PackingPriority.NORMAL, ['formal']),
  item('laptop', 'Computador y cargador', PackingCategory.WORK, 2.1, PackingPriority.HIGH, ['laptop', 'personal'], { checkedPolicy: BaggagePolicy.NOT_RECOMMENDED, packMoment: PackMoment.SAME_DAY }),
  item('camera', 'Cámara y accesorios', PackingCategory.PHOTOGRAPHY, 1.1, PackingPriority.NORMAL, ['photography', 'personal'], { checkedPolicy: BaggagePolicy.NOT_RECOMMENDED }),
  item('laundry_bag', 'Bolsa para ropa sucia', PackingCategory.ACCESSORIES, 0.08, PackingPriority.NORMAL, ['base']),
];

export const PACKING_CATALOG_BY_ID = new Map(PACKING_CATALOG.map((catalogItem) => [catalogItem.id, catalogItem]));
