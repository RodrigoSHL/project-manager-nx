import { IsString, IsOptional, IsUUID, IsNotEmpty, ValidateIf } from 'class-validator';

export class UploadFileDto {
  file: any; // Express.Multer.File

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

export class UploadFileValidationDto {
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