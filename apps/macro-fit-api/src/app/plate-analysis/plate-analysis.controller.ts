import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import sharp from 'sharp';
import { PlateAnalysisService } from './plate-analysis.service';
import { AnalyzePlateQueryDto } from './dto/analyze-plate.dto';

export interface UploadedPlateFile {
  mimetype: string;
  buffer: Buffer;
}

export const MAX_PLATE_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Controller()
export class PlateAnalysisController {
  constructor(private readonly plateAnalysisService: PlateAnalysisService) {}

  @Get('ready')
  ready() {
    return this.plateAnalysisService.readiness();
  }

  @Post('analyze-plate')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: MAX_PLATE_IMAGE_BYTES,
        files: 1,
        fields: 2,
        fieldSize: 2048,
        parts: 4,
      },
      fileFilter: (_req, file, callback) => {
        if (!IMAGE_TYPES[file.mimetype]) {
          callback(
            new UnsupportedMediaTypeException(
              'Usa una imagen JPEG, PNG o WebP.'
            ),
            false
          );
        } else {
          callback(null, true);
        }
      },
    })
  )
  async analyzePlate(
    @UploadedFile() file: UploadedPlateFile | undefined,
    @Body() body: AnalyzePlateQueryDto
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException(
        'Envía una imagen con multipart/form-data en el campo "image".'
      );
    }
    if (
      file.buffer.length > MAX_PLATE_IMAGE_BYTES ||
      !IMAGE_TYPES[file.mimetype]
    ) {
      throw new BadRequestException(
        'La imagen debe ser JPEG, PNG o WebP y no superar 5 MB.'
      );
    }
    let image: Buffer;
    try {
      const decoder = sharp(file.buffer, {
        limitInputPixels: 16_000_000,
        failOn: 'warning',
      });
      const metadata = await decoder.metadata();
      if (
        metadata.format !== IMAGE_TYPES[file.mimetype] ||
        (metadata.pages ?? 1) > 1
      ) {
        throw new Error('Unsupported image content');
      }
      // Fully decode, resize and strip metadata before sending pixels to Gemini.
      image = await decoder
        .rotate()
        .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch {
      throw new BadRequestException(
        'La imagen está dañada o su contenido no corresponde al formato indicado.'
      );
    }
    return this.plateAnalysisService.analyzePlate(
      image,
      'image/jpeg',
      body.hints,
      body.plateTypeHint
    );
  }
}
