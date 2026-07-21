import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, IsNull, Repository } from 'typeorm';
import { TripsService } from '../trips/trips.service';
import { Trip } from '../trips/entities/trip.entity';
import { Activity } from '../activities/entities/activity.entity';
import { BudgetDto, CreateExpenseDto, CreateSettlementDto, ExchangeRateDto, ExpenseQueryDto } from './dto/finance.dto';
import { Expense } from './entities/expense.entity';
import { ExpenseSplit } from './entities/expense-split.entity';
import { TripBudget } from './entities/trip-budget.entity';
import { Settlement } from './entities/settlement.entity';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { allocateEqual, convertMinor, decimalToMinor, minorToDecimal, optimizeDebts } from './money';

@Injectable()
export class FinanceService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tripsService: TripsService,
    @InjectRepository(Expense) private readonly expenses: Repository<Expense>,
    @InjectRepository(TripBudget) private readonly budgets: Repository<TripBudget>,
    @InjectRepository(Settlement) private readonly settlements: Repository<Settlement>,
    @InjectRepository(ExchangeRate) private readonly rates: Repository<ExchangeRate>,
    @InjectRepository(Activity) private readonly activities: Repository<Activity>,
  ) {}

  async getBudget(userId: string, tripId: string) {
    const trip = await this.tripsService.findOne(userId, tripId);
    const budget = await this.budgets.findOneBy({ tripId });
    return budget ? this.presentBudget(budget) : { amount: null, currency: trip.baseCurrency, categoryBudgets: {}, personalBudgets: {}, alertThresholds: [75, 90, 100] };
  }

  async upsertBudget(userId: string, tripId: string, dto: BudgetDto) {
    const trip = await this.tripsService.assertCanEdit(userId, tripId);
    this.assertParticipants(trip, Object.keys(dto.personalBudgets ?? {}));
    const currency = dto.currency.toUpperCase();
    trip.baseCurrency = currency;
    await this.dataSource.getRepository(Trip).save(trip);
    let budget = await this.budgets.findOneBy({ tripId });
    budget = this.budgets.create({ ...budget, tripId, amountMinor: decimalToMinor(dto.amount, currency).toString(), currency,
      categoryBudgets: this.mapBudget(dto.categoryBudgets, currency), personalBudgets: this.mapBudget(dto.personalBudgets, currency), alertThresholds: dto.alertThresholds ?? [75, 90, 100] });
    return this.presentBudget(await this.budgets.save(budget));
  }

  async list(userId: string, tripId: string, query: ExpenseQueryDto) {
    await this.tripsService.findOne(userId, tripId);
    const qb = this.expenses.createQueryBuilder('expense').leftJoinAndSelect('expense.splits', 'split')
      .where('expense.tripId = :tripId', { tripId }).andWhere('expense.deletedAt IS NULL');
    if (query.search) qb.andWhere(new Brackets((w) => w.where('expense.title ILIKE :search', { search: `%${query.search}%` }).orWhere('expense.notes ILIKE :search', { search: `%${query.search}%` })));
    if (query.category) qb.andWhere('expense.category = :category', { category: query.category });
    if (query.payer) qb.andWhere('expense.payerUserId = :payer', { payer: query.payer });
    if (query.participant) qb.andWhere('EXISTS (SELECT 1 FROM expense_splits participant_filter WHERE participant_filter."expenseId" = expense.id AND participant_filter."participantUserId" = :participant)', { participant: query.participant });
    if (query.expenseType) qb.andWhere('expense.expenseType = :expenseType', { expenseType: query.expenseType });
    if (query.status) qb.andWhere('expense.status = :status', { status: query.status });
    if (query.currency) qb.andWhere('expense.originalCurrency = :currency', { currency: query.currency.toUpperCase() });
    if (query.city) qb.andWhere('expense.city ILIKE :city', { city: `%${query.city}%` });
    if (query.activityId) qb.andWhere('expense.activityId = :activityId', { activityId: query.activityId });
    if (query.receipt === 'true') qb.andWhere('expense.receiptUrl IS NOT NULL');
    if (query.receipt === 'false') qb.andWhere('expense.receiptUrl IS NULL');
    if (query.quick === 'mine' || query.quick === 'involved') qb.andWhere('EXISTS (SELECT 1 FROM expense_splits current_user_split WHERE current_user_split."expenseId" = expense.id AND current_user_split."participantUserId" = :currentUserId)', { currentUserId: userId });
    if (query.quick === 'shared') qb.andWhere("expense.expenseType = 'shared'");
    if (query.quick === 'pending') qb.andWhere("expense.status IN ('pending','partial')");
    if (query.quick === 'settled') qb.andWhere("expense.status = 'paid'");
    if (query.quick === 'activities') qb.andWhere('expense.activityId IS NOT NULL');
    if (query.quick === 'uncategorized') qb.andWhere('(expense.category IS NULL OR expense.category = \'\')');
    if (query.quick === 'paid_by_me') qb.andWhere('expense.payerUserId = :currentUserId', { currentUserId: userId });
    if (query.quick === 'excludes_me') qb.andWhere('NOT EXISTS (SELECT 1 FROM expense_splits excluded_split WHERE excluded_split."expenseId" = expense.id AND excluded_split."participantUserId" = :currentUserId)', { currentUserId: userId });
    if (query.from) qb.andWhere('expense.incurredAt >= :from', { from: query.from });
    if (query.to) qb.andWhere('expense.incurredAt < (:to::date + interval \'1 day\')', { to: query.to });
    const order: Record<string, [string, 'ASC'|'DESC']> = { recent: ['expense.incurredAt','DESC'], oldest: ['expense.incurredAt','ASC'], amount_desc: ['expense.convertedAmountMinor','DESC'], amount_asc: ['expense.convertedAmountMinor','ASC'], category: ['expense.category','ASC'], updated: ['expense.updatedAt','DESC'] };
    const selected = order[query.sort ?? 'recent']; qb.orderBy(selected[0], selected[1]);
    const [items, total] = await qb.skip((query.page - 1) * query.limit).take(query.limit).getManyAndCount();
    return { items: items.map((expense) => this.presentExpense(expense)), total, page: query.page, limit: query.limit };
  }

  async create(userId: string, tripId: string, dto: CreateExpenseDto) {
    await this.tripsService.assertCanEdit(userId, tripId);
    return this.saveExpense(userId, tripId, dto);
  }

  async update(userId: string, tripId: string, expenseId: string, dto: CreateExpenseDto) {
    const trip = await this.tripsService.assertCanEdit(userId, tripId);
    const expense = await this.expenses.findOne({ where: { id: expenseId, tripId, deletedAt: IsNull() }, relations: ['splits'] });
    if (!expense) throw new NotFoundException('Expense not found');
    if (trip.userId !== userId && expense.createdByUserId !== userId) throw new ForbiddenException('You can only edit expenses you created');
    return this.saveExpense(userId, tripId, dto, expense);
  }

  async remove(userId: string, tripId: string, expenseId: string) {
    const trip = await this.tripsService.assertCanEdit(userId, tripId);
    const expense = await this.expenses.findOneBy({ id: expenseId, tripId, deletedAt: IsNull() });
    if (!expense) throw new NotFoundException('Expense not found');
    if (trip.userId !== userId && expense.createdByUserId !== userId) throw new ForbiddenException('You can only delete expenses you created');
    await this.expenses.softRemove(expense);
  }

  async duplicate(userId: string, tripId: string, expenseId: string) {
    const expense = await this.expenses.findOne({ where: { id: expenseId, tripId, deletedAt: IsNull() }, relations: ['splits'] });
    if (!expense) throw new NotFoundException('Expense not found');
    const dto = this.toDto(expense); dto.title = `${expense.title} (copia)`; dto.activityId = undefined;
    if (expense.splitMethod === 'custom_amount') {
      const original = BigInt(expense.originalAmountMinor); const converted = BigInt(expense.convertedAmountMinor);
      const parts = expense.splits.map((split) => (original * BigInt(split.amountMinor)) / converted);
      parts[parts.length - 1] += original - parts.reduce((sum, value) => sum + value, 0n);
      dto.splits = dto.splits.map((split, index) => ({ ...split, amount: minorToDecimal(parts[index], expense.originalCurrency) }));
    }
    return this.create(userId, tripId, dto);
  }

  async summary(userId: string, tripId: string) {
    const trip = await this.tripsService.findOne(userId, tripId);
    const [expenses, budget, balances] = await Promise.all([
      this.expenses.find({ where: { tripId, deletedAt: IsNull() }, relations: ['splits'], order: { incurredAt: 'DESC' } }),
      this.budgets.findOneBy({ tripId }), this.balances(userId, tripId),
    ]);
    const actual = expenses.filter((e) => !['estimated','cancelled'].includes(e.status));
    const planned = expenses.filter((e) => e.status === 'estimated');
    const sum = (list: Expense[]) => list.reduce((n, e) => n + BigInt(e.convertedAmountMinor), 0n);
    const spent = sum(actual); const plannedTotal = sum(planned); const paid = sum(actual.filter((e) => e.status === 'paid')); const pending = spent - paid;
    const categoryMap = new Map<string, bigint>(); const payerMap = new Map<string, bigint>();
    actual.forEach((e) => { categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0n) + BigInt(e.convertedAmountMinor)); payerMap.set(e.payerUserId, (payerMap.get(e.payerUserId) ?? 0n) + BigInt(e.convertedAmountMinor)); });
    const days = Math.max(1, trip.startDate ? Math.floor((Date.now() - new Date(trip.startDate + 'T00:00:00').getTime()) / 86400000) + 1 : 1);
    const remainingDays = Math.max(1, trip.endDate ? Math.ceil((new Date(trip.endDate + 'T23:59:59').getTime() - Date.now()) / 86400000) : 1);
    const budgetMinor = budget ? BigInt(budget.amountMinor) : null; const remaining = budgetMinor === null ? null : budgetMinor - spent;
    const top = (m: Map<string,bigint>) => [...m.entries()].sort((a,b) => a[1] === b[1] ? 0 : a[1] > b[1] ? -1 : 1)[0];
    return { currency: trip.baseCurrency, totalSpent: minorToDecimal(spent, trip.baseCurrency), totalPlanned: minorToDecimal(plannedTotal, trip.baseCurrency), totalPaid: minorToDecimal(paid, trip.baseCurrency), totalPending: minorToDecimal(pending, trip.baseCurrency), budget: budgetMinor === null ? null : minorToDecimal(budgetMinor, trip.baseCurrency), remaining: remaining === null ? null : minorToDecimal(remaining, trip.baseCurrency), consumedPercent: budgetMinor && budgetMinor > 0n ? Number((spent * 10000n) / budgetMinor) / 100 : null, dailyAverage: minorToDecimal(spent / BigInt(days), trip.baseCurrency), recommendedDaily: remaining === null ? null : minorToDecimal(remaining > 0n ? remaining / BigInt(remainingDays) : 0n, trip.baseCurrency), projectedFinal: minorToDecimal((spent / BigInt(days)) * BigInt(days + remainingDays), trip.baseCurrency), topCategory: top(categoryMap)?.[0] ?? null, topPayerUserId: top(payerMap)?.[0] ?? null, recent: expenses.slice(0, 5).map((e) => this.presentExpense(e)), balances };
  }

  async balances(userId: string, tripId: string) {
    const trip = await this.tripsService.findOne(userId, tripId);
    const [expenses, settlements] = await Promise.all([
      this.expenses.find({ where: { tripId, deletedAt: IsNull() }, relations: ['splits'] }),
      this.settlements.find({ where: { tripId }, order: { settledAt: 'DESC' } }),
    ]);
    const ids = [trip.userId, ...trip.members.map((m) => m.userId)]; const net = new Map(ids.map((id) => [id, 0n])); const paid = new Map(ids.map((id) => [id, 0n])); const consumed = new Map(ids.map((id) => [id, 0n]));
    expenses.filter((e) => ['paid','partial'].includes(e.status)).forEach((e) => e.splits.forEach((s) => { const amount = BigInt(s.amountMinor); consumed.set(s.participantUserId, (consumed.get(s.participantUserId) ?? 0n) + amount); if (s.generatesDebt) { net.set(e.payerUserId, (net.get(e.payerUserId) ?? 0n) + amount); net.set(s.participantUserId, (net.get(s.participantUserId) ?? 0n) - amount); paid.set(e.payerUserId, (paid.get(e.payerUserId) ?? 0n) + amount); } }));
    settlements.filter((s) => s.status === 'posted').forEach((s) => { const amount = BigInt(s.amountMinor); net.set(s.fromUserId, (net.get(s.fromUserId) ?? 0n) + amount); net.set(s.toUserId, (net.get(s.toUserId) ?? 0n) - amount); });
    const debts = optimizeDebts(Object.fromEntries(net)).map((debt) => ({ fromUserId: debt.fromUserId, toUserId: debt.toUserId, amount: minorToDecimal(debt.amountMinor, trip.baseCurrency) }));
    return { currency: trip.baseCurrency, participants: ids.map((id) => ({ userId:id, paid:minorToDecimal(paid.get(id) ?? 0n, trip.baseCurrency), consumed:minorToDecimal(consumed.get(id) ?? 0n, trip.baseCurrency), net:minorToDecimal(net.get(id) ?? 0n, trip.baseCurrency) })), debts, settlements: settlements.map((s) => ({ ...s, amount: minorToDecimal(s.amountMinor, s.currency), amountMinor: undefined })) };
  }

  async createSettlement(userId: string, tripId: string, dto: CreateSettlementDto) {
    const trip = await this.tripsService.assertCanEdit(userId, tripId); this.assertParticipants(trip, [dto.fromUserId, dto.toUserId]);
    if (dto.fromUserId === dto.toUserId) throw new BadRequestException('Settlement participants must be different');
    if (dto.currency.toUpperCase() !== trip.baseCurrency) throw new BadRequestException('Settlements must use the trip base currency');
    const settlement = this.settlements.create({ tripId, fromUserId:dto.fromUserId, toUserId:dto.toUserId, amountMinor:decimalToMinor(dto.amount, dto.currency).toString(), currency:dto.currency.toUpperCase(), settledAt:new Date(dto.settledAt), note:dto.note ?? null, referenceUrl:dto.referenceUrl ?? null, createdByUserId:userId });
    return this.settlements.save(settlement);
  }

  async voidSettlement(userId: string, tripId: string, id: string) {
    const trip = await this.tripsService.assertCanEdit(userId, tripId); const settlement = await this.settlements.findOneBy({ id, tripId });
    if (!settlement) throw new NotFoundException('Settlement not found');
    if (trip.userId !== userId && settlement.createdByUserId !== userId) throw new ForbiddenException();
    settlement.status = 'void'; settlement.voidedAt = new Date(); settlement.voidedByUserId = userId; return this.settlements.save(settlement);
  }

  async recordRate(userId:string, tripId:string, dto:ExchangeRateDto) { await this.tripsService.assertCanEdit(userId, tripId); return this.rates.save(this.rates.create({ tripId, fromCurrency:dto.fromCurrency.toUpperCase(), toCurrency:dto.toCurrency.toUpperCase(), rate:dto.rate, rateDate:dto.rateDate, source:dto.source ?? 'manual', createdByUserId:userId })); }
  async listRates(userId:string, tripId:string) { await this.tripsService.findOne(userId, tripId); return this.rates.find({ where:{tripId}, order:{rateDate:'DESC',createdAt:'DESC'}, take:100 }); }

  private async saveExpense(userId:string, tripId:string, dto:CreateExpenseDto, existing?:Expense) {
    const trip = await this.tripsService.findOne(userId, tripId); this.assertParticipants(trip, [dto.payerUserId, ...dto.splits.map((s)=>s.participantUserId)]);
    if (new Set(dto.splits.map((s)=>s.participantUserId)).size !== dto.splits.length) throw new BadRequestException('Participants cannot be repeated');
    if (dto.expenseType === 'individual' && dto.splits.length !== 1) throw new BadRequestException('Individual expenses require exactly one participant');
    const currency = dto.currency.toUpperCase(); const original = decimalToMinor(dto.amount, currency); if (original <= 0n) throw new BadRequestException('Expense amount must be greater than zero');
    const rate = currency === trip.baseCurrency ? '1' : dto.exchangeRate; if (!rate) throw new BadRequestException('Exchange rate is required for foreign currencies');
    const converted = convertMinor(original, rate, currency, trip.baseCurrency);
    const splits = this.calculateSplits(dto, original, converted, currency, trip.baseCurrency);
    if (dto.activityId) { const activity = await this.activities.findOneBy({ id:dto.activityId, tripId }); if (!activity) throw new BadRequestException('Activity does not belong to this trip'); const linked = await this.expenses.findOneBy({ activityId:dto.activityId, deletedAt:IsNull() }); if (linked && linked.id !== existing?.id) throw new BadRequestException('Activity already has an expense'); }
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Expense); const splitRepo = manager.getRepository(ExpenseSplit);
      if (existing) await splitRepo.delete({ expenseId: existing.id });
      const expense = repo.create({ ...(existing ?? {}), tripId, title:dto.title.trim(), originalAmountMinor:original.toString(), originalCurrency:currency, exchangeRate:rate, convertedAmountMinor:converted.toString(), baseCurrency:trip.baseCurrency, exchangeRateDate:dto.exchangeRateDate ?? null, exchangeRateSource:dto.exchangeRateSource ?? (currency === trip.baseCurrency ? 'identity' : 'manual'), category:dto.category, subcategory:dto.subcategory ?? null, incurredAt:new Date(dto.incurredAt), city:dto.city ?? null, createdByUserId:existing?.createdByUserId ?? userId, updatedByUserId:existing ? userId : null, payerUserId:dto.payerUserId, expenseType:dto.expenseType, splitMethod:dto.splitMethod, activityId:dto.activityId ?? null, paymentMethod:dto.paymentMethod ?? null, status:dto.status, notes:dto.notes ?? null, receiptUrl:dto.receiptUrl ?? null, items:(dto.items ?? []).map((item)=>({description:item.description,amountMinor:decimalToMinor(item.amount,currency).toString()})), recurringGroupId:dto.recurringGroupId ?? null });
      const saved = await repo.save(expense); saved.splits = await splitRepo.save(splits.map((s)=>splitRepo.create({expenseId:saved.id,...s}))); return this.presentExpense(saved);
    });
  }

  private calculateSplits(dto:CreateExpenseDto, original:bigint, converted:bigint, currency:string, baseCurrency:string) {
    let amounts: bigint[];
    if (dto.splitMethod === 'equal' || dto.splitMethod === 'gift') amounts = allocateEqual(converted, dto.splits.length);
    else if (dto.splitMethod === 'custom_amount') { const originalParts = dto.splits.map((s)=>decimalToMinor(s.amount ?? '', currency)); if (originalParts.reduce((a,b)=>a+b,0n)!==original) throw new BadRequestException('Custom split amounts must equal the expense total'); amounts=originalParts.map((a)=>convertMinor(a, dto.exchangeRate ?? '1', currency, baseCurrency)); amounts[amounts.length-1] += converted-amounts.reduce((a,b)=>a+b,0n); }
    else { const key = dto.splitMethod === 'percentage' ? 'percentage' : 'shares'; const scaled=dto.splits.map((s)=>decimalToMinor((s[key] as string) ?? '', 'BHD')); const total=scaled.reduce((a,b)=>a+b,0n); if (total<=0n || (key==='percentage' && total!==100000n)) throw new BadRequestException(key==='percentage'?'Percentages must equal 100':'Shares must be greater than zero'); amounts=scaled.map((v)=>(converted*v)/total); amounts[amounts.length-1]+=converted-amounts.reduce((a,b)=>a+b,0n); }
    return dto.splits.map((s,i)=>({ participantUserId:s.participantUserId, amountMinor:amounts[i].toString(), percentage:s.percentage ?? null, shares:s.shares ?? null, generatesDebt:dto.splitMethod==='gift' ? false : s.generatesDebt ?? true }));
  }

  private assertParticipants(trip:{userId:string;members:Array<{userId:string}>}, ids:string[]) { const allowed=new Set([trip.userId,...trip.members.map((m)=>m.userId)]); if (ids.some((id)=>!allowed.has(id))) throw new BadRequestException('Every participant must belong to the trip'); }
  private mapBudget(values:Record<string,string>|undefined,currency:string) { return Object.fromEntries(Object.entries(values ?? {}).map(([key,value])=>[key,decimalToMinor(value,currency).toString()])); }
  private presentBudget(b:TripBudget) { return { ...b, amount:minorToDecimal(b.amountMinor,b.currency), amountMinor:undefined, categoryBudgets:Object.fromEntries(Object.entries(b.categoryBudgets).map(([k,v])=>[k,minorToDecimal(v,b.currency)])), personalBudgets:Object.fromEntries(Object.entries(b.personalBudgets).map(([k,v])=>[k,minorToDecimal(v,b.currency)])) }; }
  private presentExpense(e:Expense) { return { ...e, amount:minorToDecimal(e.originalAmountMinor,e.originalCurrency), convertedAmount:minorToDecimal(e.convertedAmountMinor,e.baseCurrency), originalAmountMinor:undefined, convertedAmountMinor:undefined, items:(e.items ?? []).map((i)=>({...i,amount:minorToDecimal(i.amountMinor,e.originalCurrency),amountMinor:undefined})), splits:(e.splits ?? []).map((s)=>({...s,amount:minorToDecimal(s.amountMinor,e.baseCurrency),amountMinor:undefined})) }; }
  private toDto(e:Expense):CreateExpenseDto { return { title:e.title, amount:minorToDecimal(e.originalAmountMinor,e.originalCurrency), currency:e.originalCurrency, exchangeRate:e.exchangeRate, exchangeRateDate:e.exchangeRateDate ?? undefined, exchangeRateSource:e.exchangeRateSource ?? undefined, category:e.category, subcategory:e.subcategory ?? undefined, incurredAt:e.incurredAt.toISOString(), city:e.city ?? undefined, payerUserId:e.payerUserId, expenseType:e.expenseType, splitMethod:e.splitMethod, splits:e.splits.map((s)=>({participantUserId:s.participantUserId,amount:minorToDecimal(s.amountMinor,e.baseCurrency),percentage:s.percentage ?? undefined,shares:s.shares ?? undefined,generatesDebt:s.generatesDebt})), activityId:e.activityId ?? undefined, paymentMethod:e.paymentMethod ?? undefined, status:e.status, notes:e.notes ?? undefined, receiptUrl:e.receiptUrl ?? undefined, items:e.items.map((i)=>({description:i.description,amount:minorToDecimal(i.amountMinor,e.originalCurrency)})), recurringGroupId:e.recurringGroupId ?? undefined }; }
}
