import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../decorators/current-user.decorator';
import { InternalAuthGuard } from '../guards/internal-auth.guard';
import { AddTripLuggageDto, CreatePackingItemDto, GeneratePackingListDto, UpdatePackingItemDto, UpdateTripLuggageDto } from './dto/packing.dto';
import { PackingService } from './packing.service';

@UseGuards(InternalAuthGuard)
@Controller('trips/:tripId')
export class PackingController {
  constructor(private readonly packingService: PackingService) {}

  @Get('luggage')
  listTripLuggage(@CurrentUser() user: RequestUser, @Param('tripId') tripId: string) {
    return this.packingService.listTripLuggage(user.id, tripId);
  }

  @Post('luggage')
  addTripLuggage(@CurrentUser() user: RequestUser, @Param('tripId') tripId: string, @Body() dto: AddTripLuggageDto) {
    return this.packingService.addTripLuggage(user.id, tripId, dto);
  }

  @Patch('luggage/:id')
  updateTripLuggage(
    @CurrentUser() user: RequestUser,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTripLuggageDto,
  ) {
    return this.packingService.updateTripLuggage(user.id, tripId, id, dto);
  }

  @Delete('luggage/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTripLuggage(@CurrentUser() user: RequestUser, @Param('tripId') tripId: string, @Param('id') id: string) {
    return this.packingService.removeTripLuggage(user.id, tripId, id);
  }

  @Get('packing')
  listItems(@CurrentUser() user: RequestUser, @Param('tripId') tripId: string) {
    return this.packingService.listItems(user.id, tripId);
  }

  @Get('packing/dashboard')
  dashboard(@CurrentUser() user: RequestUser, @Param('tripId') tripId: string) {
    return this.packingService.dashboard(user.id, tripId);
  }

  @Post('packing/generate')
  generate(@CurrentUser() user: RequestUser, @Param('tripId') tripId: string, @Body() dto: GeneratePackingListDto) {
    return this.packingService.generate(user.id, tripId, dto);
  }

  @Post('packing/items')
  createItem(@CurrentUser() user: RequestUser, @Param('tripId') tripId: string, @Body() dto: CreatePackingItemDto) {
    return this.packingService.createItem(user.id, tripId, dto);
  }

  @Patch('packing/items/:id')
  updateItem(
    @CurrentUser() user: RequestUser,
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePackingItemDto,
  ) {
    return this.packingService.updateItem(user.id, tripId, id, dto);
  }

  @Delete('packing/items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeItem(@CurrentUser() user: RequestUser, @Param('tripId') tripId: string, @Param('id') id: string) {
    return this.packingService.removeItem(user.id, tripId, id);
  }
}
