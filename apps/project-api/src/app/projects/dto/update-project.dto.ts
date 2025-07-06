import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';

// UpdateProjectDto ahora incluye el campo opcional shortName heredado de CreateProjectDto.
export class UpdateProjectDto extends PartialType(CreateProjectDto) {} 