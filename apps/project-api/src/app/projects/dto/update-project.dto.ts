import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto, CreateRepositoryDto, CreateTeamMemberDto, CreateTaskDto, CreateEnvironmentDto, CreateCloudServiceDto, CreateUsefulLinkDto } from './create-project.dto';
import { IsOptional, IsArray, ValidateNested, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

// DTOs para operaciones granulares
export class UpdateRepositoryDto {
  @IsUUID()
  id: string;

  @IsOptional()
  name?: string;

  @IsOptional()
  url?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  mainBranch?: string;
}

export class UpdateTeamMemberDto {
  @IsUUID()
  id: string;

  @IsOptional()
  name?: string;

  @IsOptional()
  email?: string;

  @IsOptional()
  role?: string;

  @IsOptional()
  phone?: string;
}

export class UpdateTaskDto {
  @IsUUID()
  id: string;

  @IsOptional()
  title?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  priority?: string;

  @IsOptional()
  dueDate?: string;
}

export class UpdateEnvironmentDto {
  @IsUUID()
  id: string;

  @IsOptional()
  type?: string;

  @IsOptional()
  url?: string;

  @IsOptional()
  description?: string;
}

export class UpdateCloudServiceDto {
  @IsUUID()
  id: string;

  @IsOptional()
  name?: string;

  @IsOptional()
  provider?: string;

  @IsOptional()
  serviceType?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  endpoint?: string;

  @IsOptional()
  region?: string;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  configuration?: string;
}

export class UpdateUsefulLinkDto {
  @IsUUID()
  id: string;

  @IsOptional()
  title?: string;

  @IsOptional()
  url?: string;

  @IsOptional()
  type?: string;

  @IsOptional()
  description?: string;
}

// DTO para operaciones granulares en relaciones
export class GranularUpdateDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRepositoryDto)
  add?: CreateRepositoryDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateRepositoryDto)
  update?: UpdateRepositoryDto[];

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  delete?: string[];
}

export class GranularTeamMembersDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTeamMemberDto)
  add?: CreateTeamMemberDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTeamMemberDto)
  update?: UpdateTeamMemberDto[];

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  delete?: string[];
}

export class GranularTasksDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskDto)
  add?: CreateTaskDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTaskDto)
  update?: UpdateTaskDto[];

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  delete?: string[];
}

export class GranularEnvironmentsDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEnvironmentDto)
  add?: CreateEnvironmentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateEnvironmentDto)
  update?: UpdateEnvironmentDto[];

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  delete?: string[];
}

export class GranularCloudServicesDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCloudServiceDto)
  add?: CreateCloudServiceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCloudServiceDto)
  update?: UpdateCloudServiceDto[];

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  delete?: string[];
}

export class GranularUsefulLinksDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUsefulLinkDto)
  add?: CreateUsefulLinkDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateUsefulLinkDto)
  update?: UpdateUsefulLinkDto[];

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  delete?: string[];
}

// DTO principal para actualizaciones granulares
export class GranularUpdateProjectDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  businessUnit?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  status?: string;

  @IsOptional()
  priority?: string;

  @IsOptional()
  version?: string;

  @IsOptional()
  startDate?: string;

  @IsOptional()
  endDate?: string;

  @IsOptional()
  mainBranch?: string;

  @IsOptional()
  authenticationType?: string;

  @IsOptional()
  accessInstructions?: string;

  @IsOptional()
  shortName?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GranularUpdateDto)
  repositories?: GranularUpdateDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => GranularEnvironmentsDto)
  environments?: GranularEnvironmentsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => GranularTeamMembersDto)
  teamMembers?: GranularTeamMembersDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => GranularTasksDto)
  tasks?: GranularTasksDto;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  technologyIds?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => GranularCloudServicesDto)
  cloudServices?: GranularCloudServicesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => GranularUsefulLinksDto)
  usefulLinks?: GranularUsefulLinksDto;
}

// UpdateProjectDto ahora incluye el campo opcional shortName heredado de CreateProjectDto.
export class UpdateProjectDto extends PartialType(CreateProjectDto) {} 