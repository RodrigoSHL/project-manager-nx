import { Injectable } from '@nestjs/common';
import { PackingActivity, PackingClimate, PackingTravelStyle } from '../dto/packing.dto';
import { BaggagePolicy, PackMoment, PackingCategory, PackingPriority } from '../entities/packing-item.entity';
import { LuggageType } from '../entities/luggage.entity';
import { TripLuggage } from '../entities/trip-luggage.entity';
import { PACKING_CATALOG_BY_ID, PackingCatalogItemDefinition } from './packing-catalog';

export interface PackingRecommendationInput {
  days: number;
  climate: PackingClimate;
  activities: PackingActivity[];
  laundryAccess: boolean;
  laundryEveryDays?: number;
  style: PackingTravelStyle;
  needsMedication?: boolean;
  carriesLaptop?: boolean;
  reserveShoppingSpace?: boolean;
  luggage: TripLuggage[];
}

export interface PackingRecommendation {
  catalogItemId: string;
  name: string;
  category: PackingCategory;
  quantity: number;
  estimatedWeight: number;
  priority: PackingPriority;
  packMoment: PackMoment;
  luggageId: string | null;
  shared: boolean;
  source: string;
  ruleId: string;
  explanation: string;
  cabinPolicy: BaggagePolicy;
  checkedPolicy: BaggagePolicy;
}

export function calculateClothingCycle(days: number, laundryAccess: boolean, laundryEveryDays = 7): number {
  if (!laundryAccess) return Math.min(days, 14);
  return Math.min(days, Math.max(3, laundryEveryDays + 1));
}

export function calculateItemWeight(unitWeight: number, quantity: number): number {
  return Math.round(unitWeight * quantity * 100) / 100;
}

export function chooseLuggage(item: PackingCatalogItemDefinition, luggage: TripLuggage[]): string | null {
  if (luggage.length === 0) return null;
  const personal = luggage.find((entry) => entry.luggage.personalItemCompatible || entry.luggage.type === LuggageType.PERSONAL_BACKPACK);
  const cabin = luggage.find((entry) => entry.luggage.cabinCompatible || [LuggageType.CARRY_ON, LuggageType.TRAVEL_BACKPACK].includes(entry.luggage.type));
  const checked = luggage.find((entry) => entry.luggage.checkedBaggage || [LuggageType.CHECKED_SUITCASE, LuggageType.LARGE_SUITCASE].includes(entry.luggage.type));

  if (item.tags.includes('personal') || item.checkedPolicy === BaggagePolicy.PROHIBITED) {
    return (personal ?? cabin ?? luggage[0]).id;
  }
  if (item.tags.includes('bulky') || item.cabinPolicy === BaggagePolicy.PROHIBITED) {
    return (checked ?? cabin ?? luggage[0]).id;
  }
  return (cabin ?? checked ?? personal ?? luggage[0]).id;
}

@Injectable()
export class PackingRecommendationEngine {
  generate(input: PackingRecommendationInput): PackingRecommendation[] {
    const cycle = calculateClothingCycle(input.days, input.laundryAccess, input.laundryEveryDays);
    const multiplier = input.style === PackingTravelStyle.MINIMAL ? 0.8 : input.style === PackingTravelStyle.PREPARED ? 1.2 : 1;
    const requested = new Map<string, { quantity: number; ruleId: string; explanation: string }>();

    const add = (id: string, quantity: number, ruleId: string, explanation: string) => {
      if (!PACKING_CATALOG_BY_ID.has(id)) return;
      const current = requested.get(id);
      if (!current || quantity > current.quantity) requested.set(id, { quantity, ruleId, explanation });
    };

    ['passport', 'wallet', 'phone', 'charger', 'adapter', 'first_aid', 'sleepwear', 'walking_shoes', 'toiletry_bag', 'toothbrush', 'sunglasses', 'reusable_bottle', 'laundry_bag'].forEach((id) =>
      add(id, 1, 'base.essential', 'Incluido como parte de la lista esencial del viaje.'),
    );

    add('underwear', Math.max(3, Math.ceil(cycle * multiplier)), 'duration.underwear', this.washExplanation(input, cycle));
    add('socks', Math.max(3, Math.ceil(cycle * multiplier)), 'duration.socks', this.washExplanation(input, cycle));
    add('tshirt', Math.max(2, Math.ceil((cycle * 0.7) * multiplier)), 'duration.tops', this.washExplanation(input, cycle));
    add('pants', Math.max(1, Math.ceil((cycle / 3) * multiplier)), 'duration.bottoms', this.washExplanation(input, cycle));

    if ([PackingClimate.HOT, PackingClimate.MIXED].includes(input.climate)) {
      add('shorts', 2, 'climate.hot', 'Agregado por clima cálido o mixto.');
      add('sunscreen', 1, 'climate.hot', 'Agregado por exposición al sol.');
    }
    if ([PackingClimate.COLD, PackingClimate.SNOW, PackingClimate.MIXED].includes(input.climate)) {
      add('long_sleeve', 2, 'climate.cold', 'Agregado por días fríos en el itinerario.');
      add('warm_coat', 1, 'climate.cold', 'Agregado por clima frío o nieve.');
    } else {
      add('light_jacket', 1, 'climate.mild', 'Una capa liviana ayuda ante cambios de temperatura.');
    }
    if ([PackingClimate.RAINY, PackingClimate.MIXED].includes(input.climate)) {
      add('rain_jacket', 1, 'climate.rain', 'Agregado por posibilidad de lluvia.');
      add('umbrella', 1, 'climate.rain', 'Agregado por posibilidad de lluvia.');
    }

    if (input.activities.includes(PackingActivity.BEACH)) add('swimsuit', 1, 'activity.beach', 'Agregado porque el viaje incluye playa o piscina.');
    if (input.activities.includes(PackingActivity.RUNNING)) {
      add('running_outfit', Math.min(3, Math.max(1, Math.ceil(input.days / 4))), 'activity.running', 'Cantidad ajustada para sesiones de running.');
      add('running_shoes', 1, 'activity.running', 'Agregado porque seleccionaste running.');
    }
    if (input.activities.includes(PackingActivity.HIKING)) add('hiking_gear', 1, 'activity.hiking', 'Agregado porque el viaje incluye senderismo.');
    if (input.activities.includes(PackingActivity.FORMAL)) add('formal_outfit', 1, 'activity.formal', 'Agregado porque el viaje incluye eventos formales.');
    if (input.activities.includes(PackingActivity.PHOTOGRAPHY)) add('camera', 1, 'activity.photography', 'Agregado porque seleccionaste fotografía.');
    if (input.needsMedication) add('medication', 1, 'restriction.medication', 'Marcado como esencial porque indicaste que llevas medicamentos.');
    if (input.carriesLaptop) add('laptop', 1, 'restriction.laptop', 'Agregado porque llevarás computador.');
    if (input.style === PackingTravelStyle.PREPARED) add('extra_shoes', 1, 'style.prepared', 'Alternativa adicional por tu estilo “preparado para todo”.');

    return [...requested.entries()].map(([id, recommendation]) => {
      const catalogItem = PACKING_CATALOG_BY_ID.get(id);
      if (!catalogItem) throw new Error(`Unknown packing catalog item: ${id}`);
      return {
        catalogItemId: catalogItem.id,
        name: catalogItem.name,
        category: catalogItem.category,
        quantity: recommendation.quantity,
        estimatedWeight: calculateItemWeight(catalogItem.defaultWeight, recommendation.quantity),
        priority: catalogItem.priority,
        packMoment: catalogItem.packMoment,
        luggageId: chooseLuggage(catalogItem, input.luggage),
        shared: catalogItem.tags.includes('shared'),
        source: 'generated',
        ruleId: recommendation.ruleId,
        explanation: recommendation.explanation,
        cabinPolicy: catalogItem.cabinPolicy,
        checkedPolicy: catalogItem.checkedPolicy,
      };
    });
  }

  private washExplanation(input: PackingRecommendationInput, cycle: number): string {
    return input.laundryAccess
      ? `Cantidad calculada para ${cycle} días considerando lavado cada ${input.laundryEveryDays ?? 7} días.`
      : `Cantidad equilibrada para ${input.days} días, limitada para evitar sobrecargar el equipaje.`;
  }
}
