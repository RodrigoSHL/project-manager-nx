import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Request,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExpressRequestWithUser } from '../auth/types/express-request-with-user';
import { TravelApiClient } from './travel-api.client';

@UseGuards(JwtAuthGuard)
@Controller('api/trips')
export class TravelApiController {
  constructor(private readonly client: TravelApiClient) {}

  // ── Trips ─────────────────────────────────────────────────────────────────

  @Get()
  listTrips(@Request() req: ExpressRequestWithUser) {
    return this.client.listTrips(req.user);
  }

  @Post()
  createTrip(
    @Request() req: ExpressRequestWithUser,
    @Body() dto: Record<string, unknown>
  ) {
    return this.client.createTrip(dto, req.user);
  }

  @Get(':tripId')
  getTrip(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string
  ) {
    return this.client.getTrip(tripId, req.user);
  }

  @Patch(':tripId')
  updateTrip(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string,
    @Body() dto: Record<string, unknown>
  ) {
    return this.client.updateTrip(tripId, dto, req.user);
  }

  @Delete(':tripId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteTrip(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string
  ) {
    return this.client.deleteTrip(tripId, req.user);
  }

  // ── Trip luggage and packing ─────────────────────────────────────────────

  @Get(':tripId/luggage')
  listTripLuggage(@Request() req: ExpressRequestWithUser, @Param('tripId') tripId: string) {
    return this.client.listTripLuggage(tripId, req.user);
  }

  @Post(':tripId/luggage')
  addTripLuggage(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string,
    @Body() dto: Record<string, unknown>
  ) {
    return this.client.addTripLuggage(tripId, dto, req.user);
  }

  @Patch(':tripId/luggage/:id')
  updateTripLuggage(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() dto: Record<string, unknown>
  ) {
    return this.client.updateTripLuggage(tripId, id, dto, req.user);
  }

  @Delete(':tripId/luggage/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTripLuggage(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string,
    @Param('id') id: string
  ) {
    return this.client.removeTripLuggage(tripId, id, req.user);
  }

  @Get(':tripId/packing')
  listPackingItems(@Request() req: ExpressRequestWithUser, @Param('tripId') tripId: string) {
    return this.client.listPackingItems(tripId, req.user);
  }

  @Get(':tripId/packing/dashboard')
  packingDashboard(@Request() req: ExpressRequestWithUser, @Param('tripId') tripId: string) {
    return this.client.packingDashboard(tripId, req.user);
  }

  @Post(':tripId/packing/generate')
  generatePackingList(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string,
    @Body() dto: Record<string, unknown>
  ) {
    return this.client.generatePackingList(tripId, dto, req.user);
  }

  @Post(':tripId/packing/items')
  createPackingItem(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string,
    @Body() dto: Record<string, unknown>
  ) {
    return this.client.createPackingItem(tripId, dto, req.user);
  }

  @Patch(':tripId/packing/items/:id')
  updatePackingItem(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() dto: Record<string, unknown>
  ) {
    return this.client.updatePackingItem(tripId, id, dto, req.user);
  }

  @Delete(':tripId/packing/items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removePackingItem(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string,
    @Param('id') id: string
  ) {
    return this.client.removePackingItem(tripId, id, req.user);
  }

  // ── Sharing ───────────────────────────────────────────────────────────────

  @Get(':tripId/members')
  listMembers(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string
  ) {
    return this.client.listMembers(tripId, req.user);
  }

  @Post(':tripId/members')
  addMember(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string,
    @Body() dto: Record<string, unknown>
  ) {
    return this.client.addMember(tripId, dto, req.user);
  }

  @Patch(':tripId/members/:userId')
  updateMember(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string,
    @Param('userId') userId: string,
    @Body() dto: Record<string, unknown>
  ) {
    return this.client.updateMember(tripId, userId, dto, req.user);
  }

  @Delete(':tripId/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string,
    @Param('userId') userId: string
  ) {
    return this.client.removeMember(tripId, userId, req.user);
  }

  // ── Activities ────────────────────────────────────────────────────────────

  @Get(':tripId/activities')
  listActivities(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string
  ) {
    return this.client.listActivities(tripId, req.user);
  }

  @Post(':tripId/activities')
  createActivity(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string,
    @Body() dto: Record<string, unknown>
  ) {
    return this.client.createActivity(tripId, dto, req.user);
  }

  @Patch(':tripId/activities/:activityId')
  updateActivity(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string,
    @Param('activityId') activityId: string,
    @Body() dto: Record<string, unknown>
  ) {
    return this.client.updateActivity(tripId, activityId, dto, req.user);
  }

  @Delete(':tripId/activities/:activityId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteActivity(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string,
    @Param('activityId') activityId: string
  ) {
    return this.client.deleteActivity(tripId, activityId, req.user);
  }

  // ── Finance ──────────────────────────────────────────────────────────────
  @Get(':tripId/finance/budget') financeBudget(@Request() req:ExpressRequestWithUser,@Param('tripId') tripId:string){ return this.client.financeGet(tripId,'budget',req.user); }
  @Put(':tripId/finance/budget') saveFinanceBudget(@Request() req:ExpressRequestWithUser,@Param('tripId') tripId:string,@Body() dto:Record<string,unknown>){ return this.client.financePut(tripId,'budget',dto,req.user); }
  @Get(':tripId/finance/expenses') financeExpenses(@Request() req:ExpressRequestWithUser,@Param('tripId') tripId:string,@Query() query:Record<string,unknown>){ return this.client.financeGet(tripId,'expenses',req.user,query); }
  @Post(':tripId/finance/expenses') createFinanceExpense(@Request() req:ExpressRequestWithUser,@Param('tripId') tripId:string,@Body() dto:Record<string,unknown>){ return this.client.financePost(tripId,'expenses',dto,req.user); }
  @Patch(':tripId/finance/expenses/:id') updateFinanceExpense(@Request() req:ExpressRequestWithUser,@Param('tripId') tripId:string,@Param('id') id:string,@Body() dto:Record<string,unknown>){ return this.client.financePatch(tripId,`expenses/${id}`,dto,req.user); }
  @Delete(':tripId/finance/expenses/:id') @HttpCode(HttpStatus.NO_CONTENT) deleteFinanceExpense(@Request() req:ExpressRequestWithUser,@Param('tripId') tripId:string,@Param('id') id:string){ return this.client.financeDelete(tripId,`expenses/${id}`,req.user); }
  @Post(':tripId/finance/expenses/:id/duplicate') duplicateFinanceExpense(@Request() req:ExpressRequestWithUser,@Param('tripId') tripId:string,@Param('id') id:string){ return this.client.financePost(tripId,`expenses/${id}/duplicate`,{},req.user); }
  @Get(':tripId/finance/summary') financeSummary(@Request() req:ExpressRequestWithUser,@Param('tripId') tripId:string){ return this.client.financeGet(tripId,'summary',req.user); }
  @Get(':tripId/finance/balances') financeBalances(@Request() req:ExpressRequestWithUser,@Param('tripId') tripId:string){ return this.client.financeGet(tripId,'balances',req.user); }
  @Post(':tripId/finance/settlements') createSettlement(@Request() req:ExpressRequestWithUser,@Param('tripId') tripId:string,@Body() dto:Record<string,unknown>){ return this.client.financePost(tripId,'settlements',dto,req.user); }
  @Post(':tripId/finance/settlements/:id/void') voidSettlement(@Request() req:ExpressRequestWithUser,@Param('tripId') tripId:string,@Param('id') id:string){ return this.client.financePost(tripId,`settlements/${id}/void`,{},req.user); }
  @Get(':tripId/finance/rates') financeRates(@Request() req:ExpressRequestWithUser,@Param('tripId') tripId:string){ return this.client.financeGet(tripId,'rates',req.user); }
  @Post(':tripId/finance/rates') createFinanceRate(@Request() req:ExpressRequestWithUser,@Param('tripId') tripId:string,@Body() dto:Record<string,unknown>){ return this.client.financePost(tripId,'rates',dto,req.user); }

  // ── Travel Days ───────────────────────────────────────────────────────────

  @Get(':tripId/days')
  listDays(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string
  ) {
    return this.client.listDays(tripId, req.user);
  }

  @Put(':tripId/days/:date')
  upsertDay(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string,
    @Param('date') date: string,
    @Body() dto: Record<string, unknown>
  ) {
    return this.client.upsertDay(tripId, date, dto, req.user);
  }

  @Delete(':tripId/days/:date')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteDay(
    @Request() req: ExpressRequestWithUser,
    @Param('tripId') tripId: string,
    @Param('date') date: string
  ) {
    return this.client.deleteDay(tripId, date, req.user);
  }
}
