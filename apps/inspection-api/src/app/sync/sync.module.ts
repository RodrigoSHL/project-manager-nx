import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from '../catalog/catalog.module';
import { TenantEntity } from '../catalog/entities/tenant.entity';
import { ConceptResponseEntity } from '../works/entities/concept-response.entity';
import { TaskCompletionEntity } from '../works/entities/task-completion.entity';
import { WorkItemAnnotationEntity } from '../works/entities/work-item-annotation.entity';
import { WorkEntity } from '../works/entities/work.entity';
import { WorksModule } from '../works/works.module';
import { SyncOperationEntity } from './entities/sync-operation.entity';
import { SyncChangeParser } from './sync-change.parser';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { SyncWorkProcessor } from './sync-work.processor';

@Module({
  imports: [
    CatalogModule,
    WorksModule,
    TypeOrmModule.forFeature([
      SyncOperationEntity,
      TenantEntity,
      WorkEntity,
      ConceptResponseEntity,
      TaskCompletionEntity,
      WorkItemAnnotationEntity,
    ]),
  ],
  controllers: [SyncController],
  providers: [SyncService, SyncChangeParser, SyncWorkProcessor],
})
export class SyncModule {}
