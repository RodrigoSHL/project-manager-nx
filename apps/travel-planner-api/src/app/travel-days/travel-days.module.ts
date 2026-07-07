import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TravelDay } from './entities/travel-day.entity';
import { TravelDaysService } from './travel-days.service';
import { TravelDaysController } from './travel-days.controller';
import { TripsModule } from '../trips/trips.module';

@Module({
  imports: [TypeOrmModule.forFeature([TravelDay]), TripsModule],
  controllers: [TravelDaysController],
  providers: [TravelDaysService],
})
export class TravelDaysModule {}
