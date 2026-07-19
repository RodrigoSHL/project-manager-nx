import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsObject, IsOptional, IsString, IsUrl, Length, Matches, Max, Min, ValidateNested } from 'class-validator';

const MONEY = /^\d+(?:\.\d{1,3})?$/;
const RATE = /^\d+(?:\.\d{1,12})?$/;
export const EXPENSE_CATEGORIES = ['accommodation','transport','food','activities','shopping','health','insurance','documentation','luggage','gifts','fees','other'] as const;

export class BudgetDto {
  @Matches(MONEY) amount: string;
  @Length(3, 3) currency: string;
  @IsOptional() @IsObject() categoryBudgets?: Record<string, string>;
  @IsOptional() @IsObject() personalBudgets?: Record<string, string>;
  @IsOptional() @IsArray() @IsInt({ each: true }) @Min(1, { each: true }) @Max(100, { each: true }) alertThresholds?: number[];
}

export class ExpenseSplitDto {
  @IsString() participantUserId: string;
  @IsOptional() @Matches(MONEY) amount?: string;
  @IsOptional() @Matches(RATE) percentage?: string;
  @IsOptional() @Matches(RATE) shares?: string;
  @IsOptional() @IsBoolean() generatesDebt?: boolean;
}

export class ExpenseItemDto {
  @IsString() description: string;
  @Matches(MONEY) amount: string;
}

export class CreateExpenseDto {
  @IsString() title: string;
  @Matches(MONEY) amount: string;
  @Length(3, 3) currency: string;
  @IsOptional() @Matches(RATE) exchangeRate?: string;
  @IsOptional() @IsDateString() exchangeRateDate?: string;
  @IsOptional() @IsString() exchangeRateSource?: string;
  @IsIn(EXPENSE_CATEGORIES) category: string;
  @IsOptional() @IsString() subcategory?: string;
  @IsDateString() incurredAt: string;
  @IsOptional() @IsString() city?: string;
  @IsString() payerUserId: string;
  @IsIn(['individual', 'shared']) expenseType: 'individual' | 'shared';
  @IsIn(['equal', 'custom_amount', 'percentage', 'shares', 'gift']) splitMethod: 'equal' | 'custom_amount' | 'percentage' | 'shares' | 'gift';
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => ExpenseSplitDto) splits: ExpenseSplitDto[];
  @IsOptional() @IsString() activityId?: string;
  @IsOptional() @IsString() paymentMethod?: string;
  @IsIn(['estimated','pending','partial','paid','cancelled']) status: 'estimated'|'pending'|'partial'|'paid'|'cancelled';
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsUrl() receiptUrl?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ExpenseItemDto) items?: ExpenseItemDto[];
  @IsOptional() @IsString() recurringGroupId?: string;
}

export class UpdateExpenseDto extends CreateExpenseDto {}

export class ExpenseQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() participant?: string;
  @IsOptional() @IsString() payer?: string;
  @IsOptional() @IsString() expenseType?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() activityId?: string;
  @IsOptional() @IsIn(['true', 'false']) receipt?: string;
  @IsOptional() @IsIn(['all','mine','shared','pending','settled','activities','uncategorized','involved','paid_by_me','excludes_me']) quick?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @IsIn(['recent','oldest','amount_desc','amount_asc','category','updated']) sort?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 30;
}

export class CreateSettlementDto {
  @IsString() fromUserId: string;
  @IsString() toUserId: string;
  @Matches(MONEY) amount: string;
  @Length(3, 3) currency: string;
  @IsDateString() settledAt: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsUrl() referenceUrl?: string;
}

export class ExchangeRateDto {
  @Length(3, 3) fromCurrency: string;
  @Length(3, 3) toCurrency: string;
  @Matches(RATE) rate: string;
  @IsDateString() rateDate: string;
  @IsOptional() @IsString() source?: string;
}
