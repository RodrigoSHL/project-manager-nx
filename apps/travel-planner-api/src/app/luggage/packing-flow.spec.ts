/* eslint-disable @typescript-eslint/no-explicit-any */
import { PackingActivity, PackingClimate, PackingTravelStyle } from './dto/packing.dto';
import { LuggageType } from './entities/luggage.entity';
import { LuggageService } from './luggage.service';
import { PackingService } from './packing.service';
import { PackingRecommendationEngine } from './rules/packing-recommendation.engine';

describe('luggage packing flow', () => {
  it('creates personal luggage, assigns it to a trip and persists a generated proposal', async () => {
    const storedLuggage: any[] = [];
    const storedAssignments: any[] = [];
    const storedItems: any[] = [];
    const luggageRepository: any = {
      create: (value: any) => ({ id: 'luggage-1', archived: false, tripAssignments: [], ...value }),
      save: jest.fn(async (value: any) => { storedLuggage.push(value); return value; }),
      findOne: jest.fn(async () => storedLuggage[0]),
    };
    const tripLuggageRepository: any = {
      create: (value: any) => ({ id: 'assignment-1', ...value }),
      save: jest.fn(async (value: any) => {
        const complete = { ...value, luggage: storedLuggage[0], items: [] };
        storedAssignments.push(complete);
        return complete;
      }),
      findOneBy: jest.fn(async () => null),
      find: jest.fn(async () => storedAssignments),
    };
    const packingItemRepository: any = {
      countBy: jest.fn(async () => 0),
      create: (value: any) => value,
      save: jest.fn(async (values: any[]) => { storedItems.push(...values); return values; }),
    };
    const tripsService: any = {
      findOne: jest.fn(async () => ({
        id: 'trip-1',
        startDate: '2026-08-01',
        endDate: '2026-08-07',
        activities: [{ type: 'sightseeing', title: 'Centro histórico' }],
      })),
    };

    const luggageService = new LuggageService(luggageRepository);
    const packingService = new PackingService(
      tripLuggageRepository,
      packingItemRepository,
      luggageService,
      tripsService,
      new PackingRecommendationEngine(),
    );

    const luggage = await luggageService.create('user-1', {
      name: 'Carry-on azul',
      type: LuggageType.CARRY_ON,
      emptyWeight: 2.3,
      maxWeight: 10,
      cabinCompatible: true,
    });
    await packingService.addTripLuggage('user-1', 'trip-1', { luggageId: luggage.id });
    const proposal = await packingService.generate('user-1', 'trip-1', {
      climate: PackingClimate.MILD,
      activities: [PackingActivity.CITY],
      laundryAccess: false,
      style: PackingTravelStyle.BALANCED,
    });

    expect(luggage.ownerId).toBe('user-1');
    expect(storedAssignments).toHaveLength(1);
    expect(proposal.length).toBeGreaterThan(10);
    expect(proposal.every((item) => item.luggageId === 'assignment-1')).toBe(true);
    expect(storedItems).toHaveLength(proposal.length);
  });
});
