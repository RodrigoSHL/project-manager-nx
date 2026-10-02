import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConceptEntity } from '../catalog/entities/concept.entity';
import { TenantEntity } from '../catalog/entities/tenant.entity';
import { WorkTypeEntity } from '../catalog/entities/work-type.entity';
import { FormItemEntity } from './entities/form-item.entity';
import { FormSectionEntity } from './entities/form-section.entity';
import { FormTemplateEntity } from './entities/form-template.entity';
import { FormTemplatesController } from './form-templates.controller';
import { FormTemplatesService } from './form-templates.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TenantEntity,
      WorkTypeEntity,
      ConceptEntity,
      FormTemplateEntity,
      FormSectionEntity,
      FormItemEntity,
    ]),
  ],
  controllers: [FormTemplatesController],
  providers: [FormTemplatesService],
})
export class FormTemplatesModule {}
