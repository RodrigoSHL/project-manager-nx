import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProjectApiModule } from './project-api/project-api.module';
import { UserApiModule } from './user-api/user-api.module';
import { TravelApiModule } from './travel-api/travel-api.module';
import { FilesApiModule } from './files-api/files-api.module';
import { InspectionApiModule } from './inspection-api/inspection-api.module';

@Module({
  imports: [
    AuthModule,
    ProjectApiModule,
    UserApiModule,
    TravelApiModule,
    FilesApiModule,
    InspectionApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
