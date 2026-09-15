import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatalogModule } from './catalog/catalog.module';
import { getDatabaseConfig } from './config/database.config';
import { FormTemplatesModule } from './form-templates/form-templates.module';
import { WorksModule } from './works/works.module';
import { PlatformModule } from './platform/platform.module';
import { SyncModule } from './sync/sync.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({ useFactory: getDatabaseConfig }),
    CatalogModule,
    FormTemplatesModule,
    WorksModule,
    PlatformModule,
    SyncModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
