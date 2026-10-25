import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { PlateAnalysisService } from '../plate-analysis/plate-analysis.service';
import { webProductSearchInputSchema } from '@project-manager/macrofit-contracts';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly products: ProductsService,
    private readonly analysis: PlateAnalysisService
  ) {}
  @Post('search-web')
  @HttpCode(200)
  searchWeb(@Body() body: unknown) {
    const parsed = webProductSearchInputSchema.safeParse(body);
    if (!parsed.success)
      throw new BadRequestException('Busca usando entre 2 y 100 caracteres.');
    return this.analysis.searchProductsWeb(parsed.data.query);
  }
  @Get('search')
  async search(@Query('q') query: unknown, @Query('view') view?: unknown) {
    if (view !== undefined && view !== 'preview')
      throw new BadRequestException('Vista de búsqueda no válida.');
    const result = await this.products.search(query);
    if (view === 'preview') return result;
    // Installed clients validate the original response strictly. Keep its
    // shape unless the caller explicitly requests the richer representation.
    return {
      products: result.products.map(
        ({ preview: _preview, ...product }) => product
      ),
    };
  }
}
