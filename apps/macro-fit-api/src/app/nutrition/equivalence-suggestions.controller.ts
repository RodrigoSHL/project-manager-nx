import {
  Body,
  Controller,
  Header,
  Headers,
  HttpCode,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  productSuggestionRequestSchema,
  saveProductEquivalenceSchema,
  dateSchema,
  equivalenceSuggestionRequestSchema,
  identifierSchema,
} from '@project-manager/macrofit-contracts';
import { InternalAuthGuard, parseInput } from './nutrition.controller';
import { NutritionService } from './nutrition.service';
import { EquivalenceSuggestionsService } from './equivalence-suggestions.service';

@Controller('me')
@UseGuards(InternalAuthGuard)
export class EquivalenceSuggestionsController {
  constructor(
    private readonly service: EquivalenceSuggestionsService,
    private readonly nutrition: NutritionService
  ) {}
  @Post('foods/:id/equivalence-suggestions')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  suggestProduct(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    return this.service.suggestProduct(
      userId,
      parseInput(identifierSchema, id),
      parseInput(productSuggestionRequestSchema, body)
    );
  }
  @Put('foods/:id/equivalence')
  productEquivalence(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    return this.nutrition.saveProductEquivalence(
      userId,
      parseInput(identifierSchema, id),
      parseInput(saveProductEquivalenceSchema, body)
    );
  }
  @Post('days/:date/meals/:id/equivalence-suggestions')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  suggest(
    @Headers('x-user-id') userId: string,
    @Param('date') date: string,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    return this.service.suggest(
      userId,
      parseInput(dateSchema, date),
      parseInput(identifierSchema, id),
      parseInput(equivalenceSuggestionRequestSchema, body)
    );
  }
}
