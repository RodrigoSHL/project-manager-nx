import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from './entities/trip.entity';
import { TripMember } from './entities/trip-member.entity';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { UserApiClient } from './user-api.client';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, TripMember])],
  controllers: [TripsController],
  providers: [TripsService, UserApiClient],
  exports: [TripsService],
})
export class TripsModule {}
