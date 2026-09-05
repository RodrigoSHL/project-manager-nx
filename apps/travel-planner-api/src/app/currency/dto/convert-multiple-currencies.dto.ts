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
  Min,
} from 'class-validator';

function normalizeCurrencyCode({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}

function normalizeCurrencyList({ value }: { value: unknown }): unknown {
  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
    ? value.split(',')
    : value;
  return Array.isArray(values)
    ? values.map((item) =>
        typeof item === 'string' ? item.trim().toUpperCase() : item
      )
    : values;
}

export class ConvertMultipleCurrenciesDto {
  @Transform(normalizeCurrencyCode)
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/)
  from!: string;

  @Transform(normalizeCurrencyList)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @ArrayUnique()
  @Matches(/^[A-Z]{3}$/, { each: true })
  to!: string[];

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0.000001)
  amount!: number;
}
