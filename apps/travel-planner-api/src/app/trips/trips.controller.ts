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
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { ShareTripDto } from './dto/share-trip.dto';
import { UpdateTripMemberDto } from './dto/update-trip-member.dto';
import { CurrentUser, RequestUser } from '../decorators/current-user.decorator';
import { InternalAuthGuard } from '../guards/internal-auth.guard';

@UseGuards(InternalAuthGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateTripDto) {
    return this.tripsService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: RequestUser) {
    return this.tripsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.tripsService.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateTripDto
  ) {
    return this.tripsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.tripsService.remove(user.id, id);
  }

  @Get(':id/members')
  findMembers(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.tripsService.findMembers(user.id, id);
  }

  @Post(':id/members')
  addMember(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ShareTripDto
  ) {
    return this.tripsService.addMember(user.id, id, dto);
  }

  @Patch(':id/members/:userId')
  updateMember(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('userId') memberUserId: string,
    @Body() dto: UpdateTripMemberDto
  ) {
    return this.tripsService.updateMember(user.id, id, memberUserId, dto);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('userId') memberUserId: string
  ) {
    return this.tripsService.removeMember(user.id, id, memberUserId);
  }
}
