import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
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

// Public calculator: provider quotas and concurrency limits are enforced by the API.
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

  // Preserve the previous URL for already installed PWA clients.
  @Post(['macrofit/analyze-plate', 'analyze-plate'])
  @HttpCode(200)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
        fields: 2,
        fieldSize: 2048,
        parts: 4,
      },
      fileFilter: (_req, file, callback) => {
        if (
          !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
        ) {
          callback(
            new UnsupportedMediaTypeException(
              'Usa una imagen JPEG, PNG o WebP.'
            ),
            false
          );
        } else callback(null, true);
      },
    })
  )
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
}
