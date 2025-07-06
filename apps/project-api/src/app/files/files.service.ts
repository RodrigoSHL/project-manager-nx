import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';
import { UploadFileDto } from './dto/upload-file.dto';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
  ) {}

  async uploadFile(uploadFileDto: UploadFileDto): Promise<File> {
    const { file, userId, projectId, requestId } = uploadFileDto;

    // Validar que al menos uno de los IDs esté presente
    if (!userId && !projectId && !requestId) {
      throw new BadRequestException('Al menos uno de los campos userId, projectId o requestId debe estar presente');
    }

    // Validar que solo uno de los IDs esté presente
    const idCount = [userId, projectId, requestId].filter(id => id).length;
    if (idCount > 1) {
      throw new BadRequestException('Solo se puede asociar un archivo a una entidad a la vez');
    }

    const fileEntity = this.fileRepository.create({
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      fileData: file.buffer,
      userId,
      projectId,
      requestId,
    });

    return await this.fileRepository.save(fileEntity);
  }

  async uploadMultipleFiles(files: any[], userId?: string, projectId?: string, requestId?: string): Promise<File[]> {
    // Validar que al menos uno de los IDs esté presente
    if (!userId && !projectId && !requestId) {
      throw new BadRequestException('Al menos uno de los campos userId, projectId o requestId debe estar presente');
    }

    // Validar que solo uno de los IDs esté presente
    const idCount = [userId, projectId, requestId].filter(id => id).length;
    if (idCount > 1) {
      throw new BadRequestException('Solo se puede asociar archivos a una entidad a la vez');
    }

    // Validar que se proporcionaron archivos
    if (!files || files.length === 0) {
      throw new BadRequestException('Debe proporcionar al menos un archivo');
    }

    // Crear entidades para todos los archivos
    const fileEntities = files.map(file => 
      this.fileRepository.create({
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        fileData: file.buffer,
        userId,
        projectId,
        requestId,
      })
    );

    // Guardar todos los archivos en una transacción
    return await this.fileRepository.save(fileEntities);
  }

  async downloadFile(id: string): Promise<{ file: File; buffer: Buffer }> {
    const file = await this.fileRepository.findOne({ where: { id } });
    
    if (!file) {
      throw new NotFoundException(`Archivo con ID ${id} no encontrado`);
    }

    return {
      file,
      buffer: file.fileData,
    };
  }

  async getFilesByUserId(userId: string): Promise<File[]> {
    return await this.fileRepository.find({
      where: { userId },
      select: ['id', 'filename', 'mimetype', 'size', 'uploadedAt', 'userId', 'projectId', 'requestId'],
      order: { uploadedAt: 'DESC' },
    });
  }

  async getFilesByProjectId(projectId: string): Promise<File[]> {
    return await this.fileRepository.find({
      where: { projectId },
      select: ['id', 'filename', 'mimetype', 'size', 'uploadedAt', 'userId', 'projectId', 'requestId'],
      order: { uploadedAt: 'DESC' },
    });
  }

  async getFilesByRequestId(requestId: string): Promise<File[]> {
    return await this.fileRepository.find({
      where: { requestId },
      select: ['id', 'filename', 'mimetype', 'size', 'uploadedAt', 'userId', 'projectId', 'requestId'],
      order: { uploadedAt: 'DESC' },
    });
  }

  async deleteFile(id: string): Promise<void> {
    const result = await this.fileRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Archivo con ID ${id} no encontrado`);
    }
  }

  async getFileInfo(id: string): Promise<File> {
    const file = await this.fileRepository.findOne({
      where: { id },
      select: ['id', 'filename', 'mimetype', 'size', 'uploadedAt', 'userId', 'projectId', 'requestId'],
    });

    if (!file) {
      throw new NotFoundException(`Archivo con ID ${id} no encontrado`);
    }

    return file;
  }
} 