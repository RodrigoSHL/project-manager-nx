import { Module } from '@nestjs/common';
import { ProjectApiModule } from '../project-api/project-api.module';
import { TravelApiModule } from '../travel-api/travel-api.module';
import { FilesApiController } from './files-api.controller';
import { FilesApiService } from './files-api.service';

@Module({
  imports: [ProjectApiModule, TravelApiModule],
  controllers: [FilesApiController],
  providers: [FilesApiService],
  exports: [FilesApiService],
})
export class FilesApiModule {}
