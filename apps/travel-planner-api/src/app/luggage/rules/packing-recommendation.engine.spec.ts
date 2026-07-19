import { PackingActivity, PackingClimate, PackingTravelStyle } from '../dto/packing.dto';
import { BaggagePolicy } from '../entities/packing-item.entity';
import { Luggage, LuggageType } from '../entities/luggage.entity';
import { TripLuggage } from '../entities/trip-luggage.entity';
import {
  calculateClothingCycle,
  calculateItemWeight,
  chooseLuggage,
  PackingRecommendationEngine,
} from './packing-recommendation.engine';
import { PACKING_CATALOG_BY_ID } from './packing-catalog';

function assignment(id: string, type: LuggageType, options: Partial<Luggage> = {}): TripLuggage {
  return {
    id,
    luggage: {
      type,
      personalItemCompatible: false,
      cabinCompatible: false,
      checkedBaggage: false,
      ...options,
    } as Luggage,
  } as TripLuggage;
}

describe('PackingRecommendationEngine', () => {
  const engine = new PackingRecommendationEngine();

  it('limits clothing using the selected washing cycle', () => {
    expect(calculateClothingCycle(21, true, 5)).toBe(6);
    expect(calculateClothingCycle(21, false)).toBe(14);
  });

  it('calculates stable rounded item weights', () => {
    expect(calculateItemWeight(0.18, 7)).toBe(1.26);
  });

  it('keeps items prohibited in checked baggage inside personal or cabin luggage', () => {
    const personal = assignment('personal', LuggageType.PERSONAL_BACKPACK, { personalItemCompatible: true });
    const checked = assignment('checked', LuggageType.CHECKED_SUITCASE, { checkedBaggage: true });
    const item = PACKING_CATALOG_BY_ID.get('passport');
    expect(item).toBeDefined();
    if (!item) throw new Error('Passport catalog definition missing');
    expect(item.checkedPolicy).toBe(BaggagePolicy.PROHIBITED);
    expect(chooseLuggage(item, [checked, personal])).toBe('personal');
  });

  it('generates a deterministic, deduplicated list explained by duration and activities', () => {
    const luggage = [assignment('bag', LuggageType.CARRY_ON, { cabinCompatible: true })];
    const input = {
      days: 10,
      climate: PackingClimate.MIXED,
      activities: [PackingActivity.RUNNING, PackingActivity.BEACH],
      laundryAccess: true,
      laundryEveryDays: 5,
      style: PackingTravelStyle.BALANCED,
      luggage,
    };

    const first = engine.generate(input);
    const second = engine.generate(input);
    expect(first).toEqual(second);
    expect(new Set(first.map((item) => item.catalogItemId)).size).toBe(first.length);
    expect(first.find((item) => item.catalogItemId === 'underwear')?.quantity).toBe(6);
    expect(first.find((item) => item.catalogItemId === 'running_shoes')?.ruleId).toBe('activity.running');
    expect(first.every((item) => item.explanation.length > 0)).toBe(true);
  });
});
