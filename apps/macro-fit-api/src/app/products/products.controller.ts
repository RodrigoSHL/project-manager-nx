import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}
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
