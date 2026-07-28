import { HttpStatus } from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ExpressRequestWithUser } from '../auth/types/express-request-with-user';
import { LuggageApiController } from './luggage-api.controller';
import { TravelApiClient } from './travel-api.client';

describe('LuggageApiController', () => {
  it('forwards luggage deletion with the authenticated user and returns 204', async () => {
    const user: AuthenticatedUser = {
      userId: 'user-1',
      email: 'traveler@example.com',
      name: 'Traveler',
      roles: [],
    };
    const request = { user } as ExpressRequestWithUser;
    const client = {
      removeLuggage: jest.fn().mockResolvedValue(undefined),
    } as unknown as TravelApiClient;
    const controller = new LuggageApiController(client);

    await controller.remove(request, 'luggage-1');

    expect(client.removeLuggage).toHaveBeenCalledWith('luggage-1', user);
    expect(
      Reflect.getMetadata(HTTP_CODE_METADATA, LuggageApiController.prototype.remove)
    ).toBe(HttpStatus.NO_CONTENT);
  });
});
