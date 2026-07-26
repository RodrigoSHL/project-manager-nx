import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsNumber,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

function normalizeCurrencyCode({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}

function normalizeCurrencyList({ value }: { value: unknown }): unknown {
  return Array.isArray(value)
    ? value.map((item) =>
        typeof item === 'string' ? item.trim().toUpperCase() : item
      )
    : value;
}

export class UpdateCurrencyPreferencesDto {
  @Transform(normalizeCurrencyCode)
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/)
  baseCurrency!: string;

  @Transform(normalizeCurrencyList)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @ArrayUnique()
  @Matches(/^[A-Z]{3}$/, { each: true })
  targetCurrencies!: string[];

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(25)
  feePercent!: number;

  @Type(() => Number)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @ArrayUnique()
  @IsNumber({ maxDecimalPlaces: 2 }, { each: true })
  @Min(0.01, { each: true })
  quickAmounts!: number[];
}
