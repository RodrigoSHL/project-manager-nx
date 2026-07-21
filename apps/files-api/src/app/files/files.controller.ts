import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ListFilesQueryDto } from './dto/list-files-query.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { StoredFile } from './entities/stored-file.entity';
import { FilesService, UploadedFile as IncomingFile } from './files.service';

const maxFileSize = Number(
  process.env.FILES_MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024
);

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: maxFileSize } })
  )
  async create(
    @UploadedFile() file: IncomingFile | undefined,
    @Body() dto: UploadFileDto
  ) {
    if (!file) {
      throw new BadRequestException('A file is required');
    }

    return this.toResponse(await this.filesService.create(file, dto));
  }

  @Get()
  async findAll(@Query() query: ListFilesQueryDto) {
    const files = await this.filesService.findAll(query);
    return files.map((file) => this.toResponse(file));
  }

  @Get(':id/content')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() response: Response
  ) {
    const { file, data } = await this.filesService.download(id);

    response.type(file.mimeType);
    response.attachment(file.originalName);
    response.setHeader('Content-Length', String(file.size));
    response.send(data);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.toResponse(await this.filesService.findOne(id));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.filesService.remove(id);
  }

  private toResponse(file: StoredFile) {
    return {
      id: file.id,
      application: file.application,
      ownerType: file.ownerType,
      ownerId: file.ownerId,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      checksumSha256: file.checksumSha256,
      storageProvider: file.storageProvider,
      metadata: file.metadata,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }
}
