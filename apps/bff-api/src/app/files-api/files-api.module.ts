import { Module } from '@nestjs/common';
import { TravelApiModule } from '../travel-api/travel-api.module';
import { FilesApiController } from './files-api.controller';
import { FilesApiService } from './files-api.service';

@Module({
  imports: [TravelApiModule],
  controllers: [FilesApiController],
  providers: [FilesApiService],
  exports: [FilesApiService],
})
export class FilesApiModule {}
