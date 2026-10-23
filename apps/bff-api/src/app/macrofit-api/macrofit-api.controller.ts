import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MacrofitApiClient } from './macrofit-api.client';

class AnalyzePlateBody {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  hints?: string;

  @IsOptional()
  @IsIn(['plato_extendido', 'plato_hondo', 'bowl'])
  plateTypeHint?: string;
}

class AnalyzeMealTextBody {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  text!: string;

  @IsOptional()
  @IsIn([
    'breakfast',
    'colacion_am',
    'lunch',
    'colacion_pm',
    'dinner',
    'snacks',
  ])
  mealType?: string;
}

const imageUploadOptions = {
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 2,
    fieldSize: 2048,
    parts: 4,
  },
  fileFilter: (
    _req: unknown,
    file: { mimetype: string },
    callback: (error: Error | null, accept: boolean) => void
  ) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      callback(
        new UnsupportedMediaTypeException('Usa una imagen JPEG, PNG o WebP.'),
        false
      );
    } else callback(null, true);
  },
};

// The BFF authenticates analyses; provider quotas remain enforced by the internal API.
@Controller('api')
export class MacrofitApiController {
  constructor(private readonly macrofit: MacrofitApiClient) {}

  @Get('macrofit/health')
  health() {
    return this.macrofit.health();
  }

  @Get('macrofit/ready')
  ready() {
    return this.macrofit.ready();
  }

  @Get('macrofit/products/search')
  @UseGuards(JwtAuthGuard)
  searchProducts(@Query('q') query: unknown) {
    if (
      typeof query !== 'string' ||
      query.trim().length < 2 ||
      query.trim().length > 100
    )
      throw new BadRequestException('Busca usando entre 2 y 100 caracteres.');
    return this.macrofit.searchProducts(query.trim());
  }

  @Post('macrofit/analyze-meal-text')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  analyzeMealText(@Body() body: AnalyzeMealTextBody) {
    return this.macrofit.analyzeMealText(body);
  }

  // Preserve the previous URL for already installed PWA clients.
  @Post(['macrofit/analyze-plate', 'analyze-plate'])
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  analyze(
    @UploadedFile() file: { buffer: Buffer; mimetype: string } | undefined,
    @Body() body: AnalyzePlateBody
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException(
        'Envía una imagen con multipart/form-data en el campo "image".'
      );
    }
    return this.macrofit.analyze(file, body);
  }

  @Post('macrofit/analyze-product-label')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  analyzeProductLabel(
    @UploadedFile() file: { buffer: Buffer; mimetype: string } | undefined
  ) {
    if (!file?.buffer?.length)
      throw new BadRequestException(
        'Envía una foto de la tabla nutricional en el campo "image".'
      );
    return this.macrofit.analyzeProductLabel(file);
  }
}
