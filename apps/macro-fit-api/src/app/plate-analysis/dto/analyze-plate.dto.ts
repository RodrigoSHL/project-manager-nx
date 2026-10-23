import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const MEAL_TYPES = [
  'breakfast',
  'colacion_am',
  'lunch',
  'colacion_pm',
  'dinner',
  'snacks',
] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export class NutrientsPer100gDto {
  kcal!: number;
  protein_g!: number;
  carbs_g!: number;
  fat_g!: number;
  fiber_g!: number;
}

export class AnalyzedFoodItemDto {
  name!: string;
  category!:
    | 'proteina'
    | 'carbohidrato'
    | 'grasa'
    | 'verdura'
    | 'fruta'
    | 'lacteo'
    | 'legumbre';
  estimated_grams!: number;
  confidence!: 'alta' | 'media' | 'baja';
  nutritional_density_per_100g!: NutrientsPer100gDto;
  quantity_source?: 'declared' | 'estimated';
}

export class PlateAnalysisResponseDto {
  dish_name!: string;
  plate_type_detected!: 'plato_extendido' | 'plato_hondo' | 'bowl';
  total_estimated_kcal!: number;
  items!: AnalyzedFoodItemDto[];
  clinical_tip!: string;
  meal_type?: MealType | 'unspecified';
  assumptions?: string[];
}

export class AnalyzeMealTextDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  text!: string;

  @IsOptional()
  @IsIn(MEAL_TYPES)
  mealType?: MealType;
}

export class AnalyzePlateQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  hints?: string;

  @IsOptional()
  @IsIn(['plato_extendido', 'plato_hondo', 'bowl'])
  plateTypeHint?: 'plato_extendido' | 'plato_hondo' | 'bowl';
}
