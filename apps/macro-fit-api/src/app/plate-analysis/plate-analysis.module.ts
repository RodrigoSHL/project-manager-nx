import { Module } from '@nestjs/common';
import { PlateAnalysisController } from './plate-analysis.controller';
import { PlateAnalysisService } from './plate-analysis.service';

@Module({
  controllers: [PlateAnalysisController],
  providers: [PlateAnalysisService],
  exports: [PlateAnalysisService],
})
export class PlateAnalysisModule {}
