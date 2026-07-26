import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExpressRequestWithUser } from '../auth/types/express-request-with-user';
import { TravelApiClient } from './travel-api.client';

@UseGuards(JwtAuthGuard)
@Controller('api/currency')
export class CurrencyApiController {
  constructor(private readonly client: TravelApiClient) {}

  @Get('currencies')
  currencies(@Request() req: ExpressRequestWithUser) {
    return this.client.currencyGet('currencies', req.user);
  }

  @Get('convert')
  convert(
    @Request() req: ExpressRequestWithUser,
    @Query() query: Record<string, unknown>
  ) {
    return this.client.currencyGet('convert', req.user, query);
  }
}
