import { IsString, IsOptional, IsUUID, IsArray, IsNotEmpty, ValidateIf } from 'class-validator';

export class UploadMultipleFilesDto {
  @IsArray()
  @IsNotEmpty({ message: 'Debe proporcionar al menos un archivo' })
  files: any[]; // Express.Multer.File[]

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  requestId?: string;
}

export class UploadMultipleFilesValidationDto {
  @IsNotEmpty({ message: 'Al menos uno de los campos userId, projectId o requestId debe estar presente' })
  @ValidateIf((o) => !o.userId && !o.projectId && !o.requestId)
  @IsString()
  _atLeastOneId: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  requestId?: string;
} 