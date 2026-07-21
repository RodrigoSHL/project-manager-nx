import { PartialType } from '@nestjs/mapped-types';
import { CreateSupportDetailDto } from './create-support-detail.dto';

export class UpdateSupportDetailDto extends PartialType(CreateSupportDetailDto) {}
