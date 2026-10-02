import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class ConfirmFindingDto {
  @IsString() @MaxLength(240) title!: string;
  @IsOptional() @IsString() description?: string | null;
  @IsOptional() @IsUUID() severityId?: string | null;
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  manHours?: number | null;
  @IsOptional() @IsString() materials?: string | null;
}

export class DiscardFindingCandidateDto {
  @IsOptional() @IsString() @MaxLength(2000) reason?: string | null;
}
