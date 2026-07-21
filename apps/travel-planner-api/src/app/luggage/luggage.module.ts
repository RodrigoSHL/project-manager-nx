import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripsModule } from '../trips/trips.module';
import { Luggage } from './entities/luggage.entity';
import { PackingItem } from './entities/packing-item.entity';
import { TripLuggage } from './entities/trip-luggage.entity';
import { LuggageController } from './luggage.controller';
import { LuggageService } from './luggage.service';
import { PackingController } from './packing.controller';
import { PackingService } from './packing.service';
import { PackingRecommendationEngine } from './rules/packing-recommendation.engine';

@Module({
  imports: [TypeOrmModule.forFeature([Luggage, TripLuggage, PackingItem]), TripsModule],
  controllers: [LuggageController, PackingController],
  providers: [LuggageService, PackingService, PackingRecommendationEngine],
  exports: [LuggageService, PackingRecommendationEngine],
})
export class LuggageModule {}
