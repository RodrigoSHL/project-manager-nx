import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CurrentUser, RequestUser } from '../decorators/current-user.decorator';
import { InternalAuthGuard } from '../guards/internal-auth.guard';

@UseGuards(InternalAuthGuard)
@Controller('trips/:tripId/activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Param('tripId') tripId: string,
    @Body() dto: CreateActivityDto,
  ) {
    return this.activitiesService.create(user.id, tripId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: RequestUser, @Param('tripId') tripId: string) {
    return this.activitiesService.findAll(user.id, tripId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: RequestUser,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
  ) {
    return this.activitiesService.findOne(user.id, tripId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(user.id, tripId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: RequestUser,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
  ) {
    return this.activitiesService.remove(user.id, tripId, id);
  }
}
