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
