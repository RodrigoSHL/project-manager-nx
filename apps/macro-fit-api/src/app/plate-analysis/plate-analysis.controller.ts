import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlateAnalysisService } from './plate-analysis.service';
import { PlateAnalysisResponseDto } from './dto/analyze-plate.dto';

export interface UploadedPlateFile {
  fieldname?: string;
  originalname?: string;
  encoding?: string;
  mimetype?: string;
  size?: number;
  buffer: Buffer;
}

interface Base64AnalysisPayload {
  image?: string; // base64 or dataURI
  hints?: string;
  plateTypeHint?: 'plato_extendido' | 'plato_hondo' | 'bowl';
}

@Controller()
export class PlateAnalysisController {
  constructor(private readonly plateAnalysisService: PlateAnalysisService) {}

  @Post('analyze-plate')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('image'))
  async analyzePlate(
    @UploadedFile() file?: UploadedPlateFile,
    @Body() body?: Base64AnalysisPayload
  ): Promise<PlateAnalysisResponseDto> {
    const hints = body?.hints;
    const plateTypeHint = body?.plateTypeHint;

    // Case 1: Multipart file upload
    if (file && file.buffer) {
      return this.plateAnalysisService.analyzePlate(
        file.buffer,
        file.mimetype || 'image/jpeg',
        hints,
        plateTypeHint
      );
    }

    // Case 2: Base64 or Data URI provided in JSON body
    if (body?.image && typeof body.image === 'string') {
      let mimeType = 'image/jpeg';
      let base64Data = body.image;

      if (body.image.startsWith('data:')) {
        const matches = body.image.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64Data = matches[2];
        } else {
          throw new BadRequestException('Formato Data URI inválido para la imagen.');
        }
      }

      const buffer = Buffer.from(base64Data, 'base64');
      return this.plateAnalysisService.analyzePlate(
        buffer,
        mimeType,
        hints,
        plateTypeHint
      );
    }

    throw new BadRequestException(
      'Debes proporcionar una imagen a través de multipart form-data (campo "image") o JSON (campo base64 "image").'
    );
  }
}
