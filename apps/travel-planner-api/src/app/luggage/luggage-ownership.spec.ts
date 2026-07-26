/* eslint-disable @typescript-eslint/no-explicit-any */
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PackingCategory } from './entities/packing-item.entity';
import { LuggageService } from './luggage.service';
import { PackingService } from './packing.service';

describe('luggage ownership', () => {
  it('only lists luggage assigned to the current user for a trip', async () => {
    const tripLuggageRepository: any = {
      find: jest.fn(async () => []),
    };
    const tripsService: any = {
      findOne: jest.fn(async () => ({ id: 'trip-1' })),
    };
    const service = new PackingService(
      tripLuggageRepository,
      {} as any,
      {} as any,
      tripsService,
      {} as any,
    );

    await service.listTripLuggage('user-1', 'trip-1');

    expect(tripLuggageRepository.find).toHaveBeenCalledWith({
      where: { tripId: 'trip-1', ownerId: 'user-1' },
      relations: ['luggage', 'items'],
      order: { createdAt: 'ASC' },
    });
  });

  it('does not allow assigning an item to another user luggage', async () => {
    const tripLuggageRepository: any = {
      exist: jest.fn(async () => false),
    };
    const packingItemRepository: any = {
      create: jest.fn(),
      save: jest.fn(),
    };
    const tripsService: any = {
      findOne: jest.fn(async () => ({ id: 'trip-1' })),
    };
    const service = new PackingService(
      tripLuggageRepository,
      packingItemRepository,
      {} as any,
      tripsService,
      {} as any,
    );

    await expect(service.createItem('user-1', 'trip-1', {
      name: 'Chaqueta',
      category: PackingCategory.OUTERWEAR,
      luggageId: 'another-user-assignment',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(tripLuggageRepository.exist).toHaveBeenCalledWith({
      where: {
        id: 'another-user-assignment',
        tripId: 'trip-1',
        ownerId: 'user-1',
      },
    });
    expect(packingItemRepository.save).not.toHaveBeenCalled();
  });

  it('deletes luggage owned by the current user', async () => {
    const luggage = {
      id: 'luggage-1',
      ownerId: 'user-1',
      tripAssignments: [{ id: 'assignment-1' }],
    };
    const luggageRepository: any = {
      findOne: jest.fn(async () => luggage),
      remove: jest.fn(async () => luggage),
    };
    const service = new LuggageService(luggageRepository);

    await service.remove('user-1', 'luggage-1');

    expect(luggageRepository.remove).toHaveBeenCalledWith(luggage);
  });

  it('rejects deleting another user luggage', async () => {
    const luggageRepository: any = {
      findOne: jest.fn(async () => ({
        id: 'luggage-2',
        ownerId: 'user-2',
        tripAssignments: [],
      })),
      remove: jest.fn(),
    };
    const service = new LuggageService(luggageRepository);

    await expect(service.remove('user-1', 'luggage-2')).rejects.toBeInstanceOf(ForbiddenException);
    expect(luggageRepository.remove).not.toHaveBeenCalled();
  });
});
