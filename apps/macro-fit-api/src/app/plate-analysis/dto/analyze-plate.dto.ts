export class NutrientsPer100gDto {
  kcal!: number;
  protein_g!: number;
  carbs_g!: number;
  fat_g!: number;
  fiber_g!: number;
}

export class AnalyzedFoodItemDto {
  name!: string;
  category!: 'proteina' | 'carbohidrato' | 'grasa' | 'verdura' | 'fruta' | 'lacteo' | 'legumbre';
  estimated_grams!: number;
  confidence!: 'alta' | 'media' | 'baja';
  nutritional_density_per_100g!: NutrientsPer100gDto;
}

export class PlateAnalysisResponseDto {
  dish_name!: string;
  plate_type_detected!: 'plato_extendido' | 'plato_hondo' | 'bowl';
  total_estimated_kcal!: number;
  items!: AnalyzedFoodItemDto[];
  clinical_tip!: string;
}

export class AnalyzePlateQueryDto {
  hints?: string;
  plateTypeHint?: 'plato_extendido' | 'plato_hondo' | 'bowl';
}
