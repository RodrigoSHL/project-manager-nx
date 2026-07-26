import { Transform, Type } from 'class-transformer';
import { IsNumber, IsString, Length, Matches, Min } from 'class-validator';

function normalizeCurrencyCode({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}

export class ConvertCurrencyDto {
  @Transform(normalizeCurrencyCode)
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/)
  from!: string;

  @Transform(normalizeCurrencyCode)
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/)
  to!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0.000001)
  amount!: number;
}
