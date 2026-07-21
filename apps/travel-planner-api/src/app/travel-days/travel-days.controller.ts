import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { TravelDaysService } from './travel-days.service';
import { UpsertTravelDayDto } from './dto/upsert-travel-day.dto';
import { CurrentUser, RequestUser } from '../decorators/current-user.decorator';
import { InternalAuthGuard } from '../guards/internal-auth.guard';

@UseGuards(InternalAuthGuard)
@Controller('trips/:tripId/days')
export class TravelDaysController {
  constructor(private readonly travelDaysService: TravelDaysService) {}

  @Get()
  findAll(@CurrentUser() user: RequestUser, @Param('tripId') tripId: string) {
    return this.travelDaysService.findAll(user.id, tripId);
  }

  @Put(':date')
  upsert(
    @CurrentUser() user: RequestUser,
    @Param('tripId') tripId: string,
    @Param('date') date: string,
    @Body() dto: UpsertTravelDayDto,
  ) {
    return this.travelDaysService.upsert(user.id, tripId, { ...dto, date });
  }

  @Delete(':date')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: RequestUser,
    @Param('tripId') tripId: string,
    @Param('date') date: string,
  ) {
    return this.travelDaysService.remove(user.id, tripId, date);
  }
}
