import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../catalog/catalog.module';
import { ConceptOptionEntity } from '../catalog/entities/concept-option.entity';
import { ConceptEntity } from '../catalog/entities/concept.entity';
import { TenantEntity } from '../catalog/entities/tenant.entity';
import { FormItemEntity } from '../form-templates/entities/form-item.entity';
import { FormSectionEntity } from '../form-templates/entities/form-section.entity';
import { FormTemplateEntity } from '../form-templates/entities/form-template.entity';
import { ConceptResponseEntity } from './entities/concept-response.entity';
import { TaskCompletionEntity } from './entities/task-completion.entity';
import { WorkEntity } from './entities/work.entity';
import { WorkItemAnnotationEntity } from './entities/work-item-annotation.entity';
import { WorksController } from './works.controller';
import { WorksService } from './works.service';
import { FindingCandidateEntity } from './entities/finding-candidate.entity';
import { FindingCandidateService } from './finding-candidate.service';
import { FindingEntity } from './entities/finding.entity';
import { FindingReviewService } from './finding-review.service';
import { GeneratedReportEntity } from './entities/generated-report.entity';
import { GeneratedReportsService } from './generated-reports.service';

@Module({
  imports: [
    CatalogModule,
    TypeOrmModule.forFeature([
      WorkEntity,
      ConceptResponseEntity,
      TaskCompletionEntity,
      WorkItemAnnotationEntity,
      FormTemplateEntity,
      FormSectionEntity,
      FormItemEntity,
      ConceptEntity,
      ConceptOptionEntity,
      TenantEntity,
      FindingCandidateEntity,
      FindingEntity,
      GeneratedReportEntity,
    ]),
  ],
  controllers: [WorksController],
  providers: [WorksService, FindingCandidateService, FindingReviewService, GeneratedReportsService],
  exports: [WorksService, FindingCandidateService],
})
export class WorksModule {}
