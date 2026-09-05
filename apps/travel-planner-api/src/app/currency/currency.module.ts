import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';
import { CurrencyPreference } from './entities/currency-preference.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CurrencyPreference])],
  controllers: [CurrencyController],
  providers: [CurrencyService],
})
export class CurrencyModule {}
