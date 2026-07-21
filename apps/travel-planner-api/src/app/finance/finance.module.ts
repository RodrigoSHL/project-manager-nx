import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripsModule } from '../trips/trips.module';
import { Activity } from '../activities/entities/activity.entity';
import { Expense } from './entities/expense.entity';
import { ExpenseSplit } from './entities/expense-split.entity';
import { TripBudget } from './entities/trip-budget.entity';
import { Settlement } from './entities/settlement.entity';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

@Module({ imports:[TypeOrmModule.forFeature([Expense,ExpenseSplit,TripBudget,Settlement,ExchangeRate,Activity]),TripsModule], controllers:[FinanceController], providers:[FinanceService] })
export class FinanceModule {}
