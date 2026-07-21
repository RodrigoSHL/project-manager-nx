import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsObject, IsOptional, IsString, IsUUID, Length, Max, MaxLength, Min } from 'class-validator';
import { ChecklistStatus } from '../entities/trip-document.entity';
import { DocumentSensitivity, TravelDocumentType } from '../entities/travel-document.entity';
import { TravelerResourceKind } from '../entities/traveler-resource.entity';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateTravelerProfileDto { @IsOptional() @IsObject() personal?: Record<string, unknown>; @IsOptional() @IsObject() medical?: Record<string, unknown>; @IsOptional() @IsObject() privacy?: Record<string, unknown>; }
export class CreateTravelDocumentDto {
  @IsEnum(TravelDocumentType) type: TravelDocumentType;
  @IsString() @MaxLength(160) displayName: string;
  @IsOptional() @IsString() @Length(2,2) issuingCountry?: string;
  @IsOptional() @IsString() @MaxLength(255) documentNumber?: string;
  @IsOptional() @IsDateString() issuedAt?: string;
  @IsOptional() @IsDateString() expiresAt?: string;
  @IsOptional() @IsString() @MaxLength(160) holderName?: string;
  @IsOptional() @IsString() @MaxLength(4000) notes?: string;
  @IsOptional() @IsArray() @IsString({each:true}) tags?: string[];
  @IsOptional() @IsArray() @IsUUID('4',{each:true}) fileIds?: string[];
  @IsOptional() @IsEnum(DocumentSensitivity) sensitivity?: DocumentSensitivity;
  @IsOptional() @IsBoolean() favorite?: boolean;
  @IsOptional() @IsObject() details?: Record<string, unknown>;
}
export class UpdateTravelDocumentDto extends PartialType(CreateTravelDocumentDto) {}
export class ListDocumentsDto { @IsOptional() @IsEnum(TravelDocumentType) type?: TravelDocumentType; @IsOptional() @IsString() status?: string; @IsOptional() @IsString() search?: string; @IsOptional() @IsBoolean() favorite?: boolean; }
export class RevealDocumentNumberDto { @IsBoolean() confirm: boolean; }
export class CreateTravelerResourceDto { @IsEnum(TravelerResourceKind) kind: TravelerResourceKind; @IsString() @MaxLength(160) name: string; @IsObject() data: Record<string, unknown>; @IsOptional() @IsBoolean() favorite?: boolean; @IsOptional() @IsInt() @Min(0) @Max(1000) priority?: number; }
export class UpdateTravelerResourceDto extends PartialType(CreateTravelerResourceDto) {}
export class LinkDocumentDto { @IsUUID() documentId: string; }
export class CreateChecklistItemDto { @IsString() @MaxLength(180) label: string; @IsOptional() @IsEnum(ChecklistStatus) status?: ChecklistStatus; @IsOptional() @IsInt() position?: number; }
export class UpdateChecklistItemDto { @IsOptional() @IsString() @MaxLength(180) label?: string; @IsOptional() @IsEnum(ChecklistStatus) status?: ChecklistStatus; @IsOptional() @IsInt() position?: number; }
