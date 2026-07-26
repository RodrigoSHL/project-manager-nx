import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TravelApiClient } from './travel-api.client';
import { TravelApiController } from './travel-api.controller';
import { LuggageApiController } from './luggage-api.controller';
import { TravelerProfileApiController } from './traveler-profile-api.controller';
import { CurrencyApiController } from './currency-api.controller';

@Module({
  imports: [AuthModule],
  controllers: [TravelApiController, LuggageApiController, TravelerProfileApiController, CurrencyApiController],
  providers: [TravelApiClient],
  exports: [TravelApiClient],
})
export class TravelApiModule {}
