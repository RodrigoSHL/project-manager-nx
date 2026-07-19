import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { TripsModule } from './trips/trips.module';
import { ActivitiesModule } from './activities/activities.module';
import { TravelDaysModule } from './travel-days/travel-days.module';
import { LuggageModule } from './luggage/luggage.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TripsModule,
    ActivitiesModule,
    TravelDaysModule,
    LuggageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
