import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PlateAnalysisModule } from './plate-analysis/plate-analysis.module';

@Module({
  imports: [PlateAnalysisModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
