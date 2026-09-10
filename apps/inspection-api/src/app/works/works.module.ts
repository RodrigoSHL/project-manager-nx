import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../catalog/catalog.module';
import { ConceptOptionEntity } from '../catalog/entities/concept-option.entity';
import { ConceptEntity } from '../catalog/entities/concept.entity';
import { FormItemEntity } from '../form-templates/entities/form-item.entity';
import { FormSectionEntity } from '../form-templates/entities/form-section.entity';
import { FormTemplateEntity } from '../form-templates/entities/form-template.entity';
import { ConceptResponseEntity } from './entities/concept-response.entity';
import { TaskCompletionEntity } from './entities/task-completion.entity';
import { WorkEntity } from './entities/work.entity';
import { WorksController } from './works.controller';
import { WorksService } from './works.service';

@Module({
  imports: [
    CatalogModule,
    TypeOrmModule.forFeature([
      WorkEntity,
      ConceptResponseEntity,
      TaskCompletionEntity,
      FormTemplateEntity,
      FormSectionEntity,
      FormItemEntity,
      ConceptEntity,
      ConceptOptionEntity,
    ]),
  ],
  controllers: [WorksController],
  providers: [WorksService],
})
export class WorksModule {}
