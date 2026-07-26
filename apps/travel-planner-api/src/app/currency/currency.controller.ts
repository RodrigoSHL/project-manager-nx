import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { InternalAuthGuard } from '../guards/internal-auth.guard';
import { CurrencyService } from './currency.service';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';

@UseGuards(InternalAuthGuard)
@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('currencies')
  currencies() {
    return this.currencyService.listCurrencies();
  }

  @Get('convert')
  convert(@Query() query: ConvertCurrencyDto) {
    return this.currencyService.convert(query);
  }
}
