import { IsString, IsOptional, IsEnum, IsDateString, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus, ProjectPriority } from '../entities/project.entity';

export class CreateRepositoryDto {
  @IsString()
  name: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  mainBranch?: string;
}

export class CreateEnvironmentDto {
  @IsEnum(['local', 'development', 'staging', 'production', 'testing'])
  type: string;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateTeamMemberDto {
  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsEnum(['tech_lead', 'developer', 'devops', 'product_owner', 'scrum_master', 'qa', 'designer', 'architect'])
  role: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  priority?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class CreateCloudServiceDto {
  @IsString()
  name: string;

  @IsEnum(['aws', 'azure', 'gcp', 'digital_ocean', 'heroku', 'vercel', 'netlify'])
  provider: string;

  @IsOptional()
  @IsString()
  serviceType?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateUsefulLinkDto {
  @IsString()
  title: string;

  @IsString()
  url: string;

  @IsEnum(['documentation', 'design', 'monitoring', 'communication', 'repository', 'deployment', 'testing', 'other'])
  type: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsString()
  businessUnit: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(ProjectPriority)
  priority?: ProjectPriority;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  mainBranch?: string;

  @IsOptional()
  @IsString()
  authenticationType?: string;

  @IsOptional()
  @IsString()
  accessInstructions?: string;

  @IsOptional()
  @IsString()
  shortName?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRepositoryDto)
  repositories?: CreateRepositoryDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEnvironmentDto)
  environments?: CreateEnvironmentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTeamMemberDto)
  teamMembers?: CreateTeamMemberDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskDto)
  tasks?: CreateTaskDto[];

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  technologyIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCloudServiceDto)
  cloudServices?: CreateCloudServiceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUsefulLinkDto)
  usefulLinks?: CreateUsefulLinkDto[];
} 