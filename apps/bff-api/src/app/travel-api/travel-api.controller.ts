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
