import {
  Body,
  Controller,
  Get,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
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

  @Get('preferences')
  preferences(@Request() req: ExpressRequestWithUser) {
    return this.client.currencyGet('preferences', req.user);
  }

  @Put('preferences')
  updatePreferences(
    @Request() req: ExpressRequestWithUser,
    @Body() body: Record<string, unknown>
  ) {
    return this.client.currencyPut('preferences', body, req.user);
  }

  @Get('convert/multiple')
  convertMultiple(
    @Request() req: ExpressRequestWithUser,
    @Query() query: Record<string, unknown>
  ) {
    return this.client.currencyGet('convert/multiple', req.user, query);
  }

  @Get('convert')
  convert(
    @Request() req: ExpressRequestWithUser,
    @Query() query: Record<string, unknown>
  ) {
    return this.client.currencyGet('convert', req.user, query);
  }
}
