import { Module } from '@nestjs/common';
import { NutritionController } from './nutrition.controller';
import { NutritionService } from './nutrition.service';

import { PlateAnalysisModule } from '../plate-analysis/plate-analysis.module';
import { EquivalenceSuggestionsController } from './equivalence-suggestions.controller';
import { EquivalenceSuggestionsService } from './equivalence-suggestions.service';
@Module({
  imports: [PlateAnalysisModule],
  controllers: [NutritionController, EquivalenceSuggestionsController],
  providers: [NutritionService, EquivalenceSuggestionsService],
})
export class NutritionModule {}
