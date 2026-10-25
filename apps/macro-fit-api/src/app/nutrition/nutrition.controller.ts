import {
  BadRequestException,
  Body,
  CanActivate,
  Controller,
  Delete,
  ExecutionContext,
  Get,
  Headers,
  Injectable,
  Param,
  Post,
  Put,
  UnauthorizedException,
  UseGuards,
  Header,
} from '@nestjs/common';
import { z } from 'zod';
import {
  addMealsSchema,
  dateSchema,
  foodSchema,
  identifierSchema,
  importSchema,
  settingsSchema,
  templateSchema,
  waterSchema,
  saveNutritionPlanSchema,
  pautaSelectionSchema,
  updateMealQuantitySchema,
  productEquivalenceSchema,
  mealEquivalenceSchema,
} from '@project-manager/macrofit-contracts';
import { NutritionService } from './nutrition.service';

export function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    throw new BadRequestException(
      'Datos de MacroFit inválidos. Revisa los campos y sus cantidades.'
    );
  return parsed.data;
}

// Same trust boundary as Travel API: internal-only network, identity replaced by the BFF.
@Injectable()
export class InternalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const id = context.switchToHttp().getRequest().headers['x-user-id'];
    if (!z.string().uuid().safeParse(id).success)
      throw new UnauthorizedException('Identidad interna requerida.');
    return true;
  }
}

@Controller('me')
@UseGuards(InternalAuthGuard)
export class NutritionController {
  constructor(private readonly service: NutritionService) {}
  @Get()
  @Header('Cache-Control', 'no-store')
  account(@Headers('x-user-id') userId: string) {
    return this.service.getAccount(userId);
  }
  @Put('settings')
  settings(@Headers('x-user-id') userId: string, @Body() body: unknown) {
    return this.service.saveSettings(userId, parseInput(settingsSchema, body));
  }
  @Put('plan')
  plan(@Headers('x-user-id') userId: string, @Body() body: unknown) {
    return this.service.savePlan(
      userId,
      parseInput(saveNutritionPlanSchema, body)
    );
  }
  @Put('days/:date/meals/:id/pauta')
  classify(
    @Headers('x-user-id') userId: string,
    @Param('date') date: string,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    return this.service.classifyMeal(
      userId,
      parseInput(dateSchema, date),
      parseInput(identifierSchema, id),
      parseInput(pautaSelectionSchema, body)
    );
  }
  @Put('days/:date/meals/:id/product-equivalence')
  classifyProduct(
    @Headers('x-user-id') userId: string,
    @Param('date') date: string,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    return this.service.classifyProduct(
      userId,
      parseInput(dateSchema, date),
      parseInput(identifierSchema, id),
      parseInput(productEquivalenceSchema, body)
    );
  }
  @Put('days/:date/meals/:id/equivalence')
  classifyMealEquivalence(
    @Headers('x-user-id') userId: string,
    @Param('date') date: string,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    return this.service.classifyMealEquivalence(
      userId,
      parseInput(dateSchema, date),
      parseInput(identifierSchema, id),
      parseInput(mealEquivalenceSchema, body)
    );
  }
  @Get('days/:date')
  @Header('Cache-Control', 'no-store')
  day(@Headers('x-user-id') userId: string, @Param('date') date: string) {
    return this.service.getDay(userId, parseInput(dateSchema, date));
  }
  @Post('days/:date/meals')
  meals(
    @Headers('x-user-id') userId: string,
    @Param('date') date: string,
    @Body() body: unknown
  ) {
    return this.service.addMeals(
      userId,
      parseInput(dateSchema, date),
      parseInput(addMealsSchema, body).entries
    );
  }
  @Delete('days/:date/meals/:id')
  removeMeal(
    @Headers('x-user-id') userId: string,
    @Param('date') date: string,
    @Param('id') id: string
  ) {
    return this.service.removeMeal(
      userId,
      parseInput(dateSchema, date),
      parseInput(identifierSchema, id)
    );
  }
  @Put('days/:date/meals/:id/quantity')
  quantity(
    @Headers('x-user-id') userId: string,
    @Param('date') date: string,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    return this.service.updateMealQuantity(
      userId,
      parseInput(dateSchema, date),
      parseInput(identifierSchema, id),
      parseInput(updateMealQuantitySchema, body)
    );
  }
  @Post('days/:date/water')
  water(
    @Headers('x-user-id') userId: string,
    @Param('date') date: string,
    @Body() body: unknown
  ) {
    return this.service.changeWater(
      userId,
      parseInput(dateSchema, date),
      parseInput(waterSchema, body)
    );
  }
  @Put('foods')
  food(@Headers('x-user-id') userId: string, @Body() body: unknown) {
    return this.service.saveFood(userId, parseInput(foodSchema, body));
  }
  @Put('templates')
  template(@Headers('x-user-id') userId: string, @Body() body: unknown) {
    return this.service.saveTemplate(userId, parseInput(templateSchema, body));
  }
  @Delete('foods/:id')
  removeFood(@Headers('x-user-id') userId: string, @Param('id') id: string) {
    return this.service.removeCatalogItem(
      userId,
      'foods',
      parseInput(identifierSchema, id)
    );
  }
  @Delete('templates/:id')
  removeTemplate(
    @Headers('x-user-id') userId: string,
    @Param('id') id: string
  ) {
    return this.service.removeCatalogItem(
      userId,
      'templates',
      parseInput(identifierSchema, id)
    );
  }
  @Post('import')
  import(@Headers('x-user-id') userId: string, @Body() body: unknown) {
    return this.service.importLegacy(userId, parseInput(importSchema, body));
  }
}
