import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from '../entities/file.entity';

@Injectable()
export class FileSeed {
  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
  ) {}

  async seed() {
    console.log('🌱 Sembrando datos de archivos...');

    // Crear algunos archivos de ejemplo
    const sampleFiles = [
      {
        filename: 'documento-ejemplo.pdf',
        mimetype: 'application/pdf',
        size: 1024 * 1024, // 1MB
        fileData: Buffer.from('Contenido de ejemplo para PDF'),
        userId: '550e8400-e29b-41d4-a716-446655440000',
        projectId: null,
        requestId: null,
      },
      {
        filename: 'imagen-proyecto.jpg',
        mimetype: 'image/jpeg',
        size: 512 * 1024, // 512KB
        fileData: Buffer.from('Contenido de ejemplo para imagen'),
        userId: null,
        projectId: '550e8400-e29b-41d4-a716-446655440001',
        requestId: null,
      },
      {
        filename: 'archivo-solicitud.txt',
        mimetype: 'text/plain',
        size: 256, // 256 bytes
        fileData: Buffer.from('Contenido de ejemplo para archivo de texto'),
        userId: null,
        projectId: null,
        requestId: '550e8400-e29b-41d4-a716-446655440002',
      },
    ];

    for (const fileData of sampleFiles) {
      const existingFile = await this.fileRepository.findOne({
        where: { filename: fileData.filename },
      });

      if (!existingFile) {
        const file = this.fileRepository.create(fileData);
        await this.fileRepository.save(file);
        console.log(`✅ Archivo creado: ${fileData.filename}`);
      } else {
        console.log(`⏭️  Archivo ya existe: ${fileData.filename}`);
      }
    }

    console.log('✅ Datos de archivos sembrados correctamente');
  }
} 