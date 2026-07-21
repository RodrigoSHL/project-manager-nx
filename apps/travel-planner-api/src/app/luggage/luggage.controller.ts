import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../decorators/current-user.decorator';
import { InternalAuthGuard } from '../guards/internal-auth.guard';
import { CreateLuggageDto, UpdateLuggageDto } from './dto/luggage.dto';
import { LuggageService } from './luggage.service';

@UseGuards(InternalAuthGuard)
@Controller('luggage')
export class LuggageController {
  constructor(private readonly luggageService: LuggageService) {}

  @Get()
  findAll(@CurrentUser() user: RequestUser, @Query('includeArchived') includeArchived?: string) {
    return this.luggageService.findAll(user.id, includeArchived === 'true');
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateLuggageDto) {
    return this.luggageService.create(user.id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateLuggageDto) {
    return this.luggageService.update(user.id, id, dto);
  }

  @Post(':id/duplicate')
  duplicate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.luggageService.duplicate(user.id, id);
  }

  @Post(':id/archive')
  archive(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.luggageService.archive(user.id, id);
  }
}
