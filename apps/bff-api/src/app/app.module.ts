import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProjectApiModule } from './project-api/project-api.module';

@Module({
  imports: [AuthModule, ProjectApiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
