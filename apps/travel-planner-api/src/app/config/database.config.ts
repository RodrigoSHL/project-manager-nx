import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Trip } from '../trips/entities/trip.entity';
import { Activity } from '../activities/entities/activity.entity';
import { TravelDay } from '../travel-days/entities/travel-day.entity';
import { TripMember } from '../trips/entities/trip-member.entity';
import { Luggage } from '../luggage/entities/luggage.entity';
import { TripLuggage } from '../luggage/entities/trip-luggage.entity';
import { PackingItem } from '../luggage/entities/packing-item.entity';
import { CreateLuggagePacking1784332800000 } from '../../migrations/1784332800000-CreateLuggagePacking';
import { CreateTripMembers1784332700000 } from '../../migrations/1784332700000-CreateTripMembers';
import { Expense } from '../finance/entities/expense.entity';
import { ExpenseSplit } from '../finance/entities/expense-split.entity';
import { TripBudget } from '../finance/entities/trip-budget.entity';
import { Settlement } from '../finance/entities/settlement.entity';
import { ExchangeRate } from '../finance/entities/exchange-rate.entity';
import { CreateTripFinance1784332900000 } from '../../migrations/1784332900000-CreateTripFinance';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.TRAVEL_DB_HOST || 'localhost',
  port: parseInt(process.env.TRAVEL_DB_PORT) || 5432,
  username: process.env.TRAVEL_DB_USERNAME || 'postgres',
  password: process.env.TRAVEL_DB_PASSWORD || 'postgres',
  database: process.env.TRAVEL_DB_NAME || 'travel_planner_db',
  entities: [Trip, TripMember, Activity, TravelDay, Luggage, TripLuggage, PackingItem, Expense, ExpenseSplit, TripBudget, Settlement, ExchangeRate],
  migrations: [
    CreateTripMembers1784332700000,
    CreateLuggagePacking1784332800000,
    CreateTripFinance1784332900000,
  ],
  migrationsRun: process.env.TRAVEL_MIGRATIONS_RUN === 'true',
  synchronize: process.env.TYPEORM_SYNCHRONIZE
    ? process.env.TYPEORM_SYNCHRONIZE === 'true'
    : process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
};
