import { Controller, Get, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}
  @Get('search')
  search(@Query('q') query: unknown) {
    return this.products.search(query);
  }
}
