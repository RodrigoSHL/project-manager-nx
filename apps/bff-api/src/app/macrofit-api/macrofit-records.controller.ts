import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
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
} from '@project-manager/macrofit-contracts';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MacrofitApiClient } from './macrofit-api.client';

type AuthenticatedRequest = { user: { userId: string } };
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new BadRequestException(
      'Datos de MacroFit inválidos. Revisa los campos y sus cantidades.'
    );
  return result.data;
}
const segment = (id: string) => encodeURIComponent(parse(identifierSchema, id));
const day = (date: string) => `/days/${parse(dateSchema, date)}`;

@Controller('api/macrofit/me')
@UseGuards(JwtAuthGuard)
export class MacrofitRecordsController {
  constructor(private readonly macrofit: MacrofitApiClient) {}
  private send(
    req: AuthenticatedRequest,
    path: string,
    method = 'GET',
    body?: unknown
  ) {
    return this.macrofit.records(
      parse(z.string().uuid(), req.user.userId),
      path,
      method,
      body
    );
  }
  @Get()
  @Header('Cache-Control', 'no-store')
  account(@Req() req: AuthenticatedRequest) {
    return this.send(req, '');
  }
  @Put('settings')
  settings(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.send(req, '/settings', 'PUT', parse(settingsSchema, body));
  }
  @Put('plan')
  plan(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.send(req, '/plan', 'PUT', parse(saveNutritionPlanSchema, body));
  }
  @Put('days/:date/meals/:id/pauta')
  classify(
    @Req() req: AuthenticatedRequest,
    @Param('date') date: string,
    @Param('id') id: string,
    @Body() body: unknown
  ) {
    return this.send(
      req,
      `${day(date)}/meals/${segment(id)}/pauta`,
      'PUT',
      parse(pautaSelectionSchema, body)
    );
  }
  @Get('days/:date')
  @Header('Cache-Control', 'no-store')
  log(@Req() req: AuthenticatedRequest, @Param('date') date: string) {
    return this.send(req, day(date));
  }
  @Post('days/:date/meals')
  meals(
    @Req() req: AuthenticatedRequest,
    @Param('date') date: string,
    @Body() body: unknown
  ) {
    return this.send(
      req,
      `${day(date)}/meals`,
      'POST',
      parse(addMealsSchema, body)
    );
  }
  @Delete('days/:date/meals/:id')
  removeMeal(
    @Req() req: AuthenticatedRequest,
    @Param('date') date: string,
    @Param('id') id: string
  ) {
    return this.send(req, `${day(date)}/meals/${segment(id)}`, 'DELETE');
  }
  @Post('days/:date/water')
  water(
    @Req() req: AuthenticatedRequest,
    @Param('date') date: string,
    @Body() body: unknown
  ) {
    return this.send(
      req,
      `${day(date)}/water`,
      'POST',
      parse(waterSchema, body)
    );
  }
  @Put('foods')
  food(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.send(req, '/foods', 'PUT', parse(foodSchema, body));
  }
  @Put('templates')
  template(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.send(req, '/templates', 'PUT', parse(templateSchema, body));
  }
  @Delete('foods/:id')
  removeFood(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.send(req, `/foods/${segment(id)}`, 'DELETE');
  }
  @Delete('templates/:id')
  removeTemplate(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.send(req, `/templates/${segment(id)}`, 'DELETE');
  }
  @Post('import')
  import(@Req() req: AuthenticatedRequest, @Body() body: unknown) {
    return this.send(req, '/import', 'POST', parse(importSchema, body));
  }
}
