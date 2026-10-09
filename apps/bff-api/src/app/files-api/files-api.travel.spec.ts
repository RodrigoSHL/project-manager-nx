import { ForbiddenException } from '@nestjs/common';
import { FilesApiService, IncomingFile } from './files-api.service';
import { TravelApiClient } from '../travel-api/travel-api.client';
import { UserRole } from '../user-api/user-api.client';

const tripId = '8b087a16-a4b1-494d-9123-e228073c289e';
const activityId = '5b436236-af60-489e-aa8a-7893041fbe54';
const user = {
  userId: tripId,
  email: 'viewer@example.com',
  name: 'Viewer',
  roles: [UserRole.USER],
};
const storedFile = {
  id: '86c33190-a73a-4ab8-bccc-df8d25c65a4e',
  application: 'travel-planner-app',
  ownerType: 'activity',
  ownerId: activityId,
  metadata: { category: 'activity-document', tripId },
};
const incoming: IncomingFile = {
  buffer: Buffer.from('pdf'),
  mimetype: 'application/pdf',
  originalname: 'trip.pdf',
  size: 3,
};

describe('activity attachment permissions', () => {
  const originalFetch = global.fetch;
  let travel: {
    getActivity: jest.Mock;
    getEditableActivity: jest.Mock;
    travelerGet: jest.Mock;
  };
  let service: FilesApiService;
  let fetchMock: jest.Mock;
  beforeEach(() => {
    travel = {
      getActivity: jest.fn().mockResolvedValue({ id: activityId }),
      getEditableActivity: jest
        .fn()
        .mockRejectedValue(new ForbiddenException('Trip is read-only')),
      travelerGet: jest.fn().mockResolvedValue({}),
    };
    service = new FilesApiService(
      travel as unknown as TravelApiClient,
      null,
      null,
      null
    );
    fetchMock = jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify(storedFile)))
      );
    global.fetch = fetchMock;
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('denies viewer uploads before storage is changed', async () => {
    await expect(
      service.upload(
        incoming,
        {
          application: 'travel-planner-app',
          ownerType: 'activity',
          ownerId: activityId,
          metadata: JSON.stringify(storedFile.metadata),
        },
        user
      )
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('denies viewer deletion before storage is changed', async () => {
    await expect(service.remove(storedFile.id, user)).rejects.toBeInstanceOf(
      ForbiddenException
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]?.method).not.toBe('DELETE');
  });
  it('preserves viewer reads', async () => {
    expect(await service.get(storedFile.id, user)).toEqual(storedFile);
    expect(travel.getActivity).toHaveBeenCalledWith(tripId, activityId, user);
    expect(travel.getEditableActivity).not.toHaveBeenCalled();
  });
  it('allows authorized uploads and deletion', async () => {
    travel.getEditableActivity.mockResolvedValue({ id: activityId });
    await service.upload(
      incoming,
      {
        application: 'travel-planner-app',
        ownerType: 'activity',
        ownerId: activityId,
        metadata: JSON.stringify(storedFile.metadata),
      },
      user
    );
    await service.remove(storedFile.id, user);
    expect(travel.getEditableActivity).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map(([, init]) => init?.method)).toEqual([
      'POST',
      undefined,
      'DELETE',
    ]);
  });
  it('preserves owned traveler document uploads', async () => {
    await service.upload(
      incoming,
      {
        application: 'travel-planner-app',
        ownerType: 'traveler-document',
        ownerId: activityId,
        metadata: JSON.stringify({ category: 'traveler-document' }),
      },
      user
    );
    expect(travel.travelerGet).toHaveBeenCalledWith(
      `/documents/${activityId}`,
      user
    );
    expect(travel.getEditableActivity).not.toHaveBeenCalled();
  });
});
