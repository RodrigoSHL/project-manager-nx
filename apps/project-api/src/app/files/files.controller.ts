import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  Res,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FilesService } from './files.service';
import { UploadFileDto } from './dto/upload-file.dto';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: any,
    @Body() body: { userId?: string; projectId?: string; requestId?: string; type?: string; description?: string },
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const uploadFileDto: UploadFileDto = {
      file,
      userId: body.userId,
      projectId: body.projectId,
      requestId: body.requestId,
      type: body.type as any,
      description: body.description,
    };

    const uploadedFile = await this.filesService.uploadFile(uploadFileDto);
    
    // Retornar solo la información del archivo, no los datos binarios
    return {
      id: uploadedFile.id,
      filename: uploadedFile.filename,
      mimetype: uploadedFile.mimetype,
      size: uploadedFile.size,
      type: uploadedFile.type,
      description: uploadedFile.description,
      uploadedAt: uploadedFile.uploadedAt,
      userId: uploadedFile.userId,
      projectId: uploadedFile.projectId,
      requestId: uploadedFile.requestId,
    };
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10)) // Máximo 10 archivos
  async uploadMultipleFiles(
    @UploadedFiles() files: any[],
    @Body() body: { userId?: string; projectId?: string; requestId?: string; type?: string; description?: string },
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se proporcionaron archivos');
    }

    const uploadedFiles = await this.filesService.uploadMultipleFiles(
      files,
      body.userId,
      body.projectId,
      body.requestId,
      body.type as any,
      body.description,
    );
    
    // Retornar solo la información de los archivos, no los datos binarios
    return uploadedFiles.map(file => ({
      id: file.id,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      type: file.type,
      description: file.description,
      uploadedAt: file.uploadedAt,
      userId: file.userId,
      projectId: file.projectId,
      requestId: file.requestId,
    }));
  }

  @Get(':id')
  async downloadFile(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const { file, buffer } = await this.filesService.downloadFile(id);

    res.set({
      'Content-Type': file.mimetype,
      'Content-Disposition': `attachment; filename="${file.filename}"`,
      'Content-Length': file.size.toString(),
    });

    res.send(buffer);
  }

  @Get('info/:id')
  async getFileInfo(@Param('id', ParseUUIDPipe) id: string) {
    return await this.filesService.getFileInfo(id);
  }

  @Get('user/:userId')
  async getFilesByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    return await this.filesService.getFilesByUserId(userId);
  }

  @Get('project/:projectId')
  async getFilesByProjectId(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return await this.filesService.getFilesByProjectId(projectId);
  }

  @Get('request/:requestId')
  async getFilesByRequestId(@Param('requestId', ParseUUIDPipe) requestId: string) {
    return await this.filesService.getFilesByRequestId(requestId);
  }

  @Delete(':id')
  async deleteFile(@Param('id', ParseUUIDPipe) id: string) {
    await this.filesService.deleteFile(id);
    return { message: 'Archivo eliminado exitosamente' };
  }
} 