import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExpressRequestWithUser } from '../auth/types/express-request-with-user';
import { TravelApiClient } from './travel-api.client';

@UseGuards(JwtAuthGuard)
@Controller('api/luggage')
export class LuggageApiController {
  constructor(private readonly client: TravelApiClient) {}

  @Get()
  list(@Request() req: ExpressRequestWithUser) {
    return this.client.listLuggage(req.user);
  }

  @Post()
  create(@Request() req: ExpressRequestWithUser, @Body() dto: Record<string, unknown>) {
    return this.client.createLuggage(dto, req.user);
  }

  @Patch(':id')
  update(
    @Request() req: ExpressRequestWithUser,
    @Param('id') id: string,
    @Body() dto: Record<string, unknown>
  ) {
    return this.client.updateLuggage(id, dto, req.user);
  }

  @Post(':id/duplicate')
  duplicate(@Request() req: ExpressRequestWithUser, @Param('id') id: string) {
    return this.client.duplicateLuggage(id, req.user);
  }

  @Post(':id/archive')
  archive(@Request() req: ExpressRequestWithUser, @Param('id') id: string) {
    return this.client.archiveLuggage(id, req.user);
  }
}
