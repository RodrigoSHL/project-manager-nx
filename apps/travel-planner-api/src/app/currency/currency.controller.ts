import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../decorators/current-user.decorator';
import { InternalAuthGuard } from '../guards/internal-auth.guard';
import { CurrencyService } from './currency.service';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { ConvertMultipleCurrenciesDto } from './dto/convert-multiple-currencies.dto';
import { UpdateCurrencyPreferencesDto } from './dto/update-currency-preferences.dto';

@UseGuards(InternalAuthGuard)
@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('currencies')
  currencies() {
    return this.currencyService.listCurrencies();
  }

  @Get('preferences')
  preferences(@CurrentUser() user: RequestUser) {
    return this.currencyService.getPreferences(user.id);
  }

  @Put('preferences')
  updatePreferences(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateCurrencyPreferencesDto
  ) {
    return this.currencyService.updatePreferences(user.id, dto);
  }

  @Get('convert/multiple')
  convertMultiple(@Query() query: ConvertMultipleCurrenciesDto) {
    return this.currencyService.convertMultiple(query);
  }

  @Get('convert')
  convert(@Query() query: ConvertCurrencyDto) {
    return this.currencyService.convert(query);
  }
}
