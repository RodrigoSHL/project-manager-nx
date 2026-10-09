import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { TripsService } from '../trips/trips.service';
import { TripMemberRole } from '../trips/entities/trip-member.entity';
import { Repository } from 'typeorm';
import { Trip } from '../trips/entities/trip.entity';
import { TripMember } from '../trips/entities/trip-member.entity';
import { Activity } from './entities/activity.entity';
import { UserApiClient } from '../trips/user-api.client';

describe('activity edit access', () => {
  const activity = { id: 'activity', tripId: 'trip' };
  const trip = {
    id: 'trip',
    userId: 'owner',
    members: [
      { userId: 'editor', role: TripMemberRole.EDITOR },
      { userId: 'viewer', role: TripMemberRole.VIEWER },
    ],
  };
  let repository: { findOne: jest.Mock; save: jest.Mock; remove: jest.Mock };
  let service: ActivitiesService;
  beforeEach(() => {
    repository = {
      findOne: jest
        .fn()
        .mockImplementation(({ where }) =>
          where.id === activity.id && where.tripId === activity.tripId
            ? activity
            : null
        ),
      save: jest.fn(),
      remove: jest.fn(),
    };
    const trips = new TripsService(
      {
        findOne: jest.fn().mockResolvedValue(trip),
      } as unknown as Repository<Trip>,
      {} as Repository<TripMember>,
      {} as UserApiClient
    );
    service = new ActivitiesService(
      repository as unknown as Repository<Activity>,
      trips
    );
  });
  it.each(['owner', 'editor'])(
    'authorizes %s without mutations',
    async (userId) => {
      expect(
        await service.findEditable(userId, 'trip', 'activity')
      ).toMatchObject(activity);
      expect(repository.save).not.toHaveBeenCalled();
      expect(repository.remove).not.toHaveBeenCalled();
    }
  );
  it.each(['viewer', 'outsider'])('denies %s', async (userId) => {
    await expect(
      service.findEditable(userId, 'trip', 'activity')
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.findOne).not.toHaveBeenCalled();
  });
  it('preserves viewer reads', async () => {
    expect(await service.findOne('viewer', 'trip', 'activity')).toMatchObject(
      activity
    );
  });
  it('rejects an activity belonging to another trip', async () => {
    await expect(
      service.findEditable('owner', 'trip', 'foreign')
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 'foreign', tripId: 'trip' },
    });
  });
});
