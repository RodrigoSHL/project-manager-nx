import { BadRequestException } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateExpenseDto } from './dto/finance.dto';
import { Expense } from './entities/expense.entity';
import { ExpenseSplit } from './entities/expense-split.entity';
import { TripBudget } from './entities/trip-budget.entity';
import { Trip } from '../trips/entities/trip.entity';

const trip = { id: 'trip', userId: 'owner', baseCurrency: 'USD', startDate: null, endDate: null, members: [{ userId: 'member', role: 'editor' }] };
const baseDto: CreateExpenseDto = { title:'Dinner',amount:'120.00',currency:'USD',category:'food',incurredAt:'2026-07-19T18:00:00.000Z',payerUserId:'owner',expenseType:'shared',splitMethod:'equal',splits:[{participantUserId:'owner'},{participantUserId:'member'}],status:'paid' };

function setup() {
  const currentTrip = { ...trip, members: [...trip.members] };
  const transactionExpenses = {
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: value.id ?? 'expense-id', ...value })),
  };
  const transactionSplits = {
    delete: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
  };
  const transactionBudgets = {
    findOneBy: jest.fn().mockResolvedValue(null),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: 'budget-id', ...value })),
  };
  const transactionTrips = { save: jest.fn(async (value) => value) };
  const manager = {
    getRepository: jest.fn((entity) => {
      if (entity === Expense) return transactionExpenses;
      if (entity === ExpenseSplit) return transactionSplits;
      if (entity === TripBudget) return transactionBudgets;
      if (entity === Trip) return transactionTrips;
      throw new Error(`Unexpected repository ${String(entity)}`);
    }),
  };
  const dataSource = {
    transaction: jest.fn((callback) => callback(manager)),
    getRepository: jest.fn(() => transactionTrips),
  };
  const trips = { assertCanEdit: jest.fn().mockResolvedValue(currentTrip), findOne: jest.fn().mockResolvedValue(currentTrip) };
  const expenses = { findOne: jest.fn(), findOneBy: jest.fn(), find: jest.fn().mockResolvedValue([]), createQueryBuilder: jest.fn() };
  const budgets = { findOneBy: jest.fn().mockResolvedValue(null), delete: jest.fn() };
  const settlements = { find: jest.fn().mockResolvedValue([]), countBy: jest.fn().mockResolvedValue(0) };
  const rates = {}; const activities = { findOneBy: jest.fn() };
  return {
    service:new FinanceService(dataSource as never,trips as never,expenses as never,budgets as never,settlements as never,rates as never,activities as never),
    dataSource,
    trips,
    expenses,
    budgets,
    settlements,
    activities,
    transactionExpenses,
    transactionSplits,
    transactionBudgets,
    transactionTrips,
  };
}

describe('FinanceService business boundaries', () => {
  it('rejects a payer or split participant outside the trip', async () => {
    const { service, dataSource } = setup();
    await expect(service.create('owner','trip',{...baseDto,splits:[...baseDto.splits,{participantUserId:'outsider'}]})).rejects.toBeInstanceOf(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
  it('rejects repeated participants', async () => {
    const { service } = setup();
    await expect(service.create('owner','trip',{...baseDto,splits:[{participantUserId:'member'},{participantUserId:'member'}]})).rejects.toThrow('Participants cannot be repeated');
  });
  it('rejects custom amounts that do not match the total', async () => {
    const { service } = setup();
    await expect(service.create('owner','trip',{...baseDto,splitMethod:'custom_amount',splits:[{participantUserId:'owner',amount:'10.00'},{participantUserId:'member',amount:'20.00'}]})).rejects.toThrow('Custom split amounts must equal the expense total');
  });
  it('prevents linking a second expense to the same activity', async () => {
    const { service, activities, expenses } = setup(); activities.findOneBy.mockResolvedValue({id:'activity'}); expenses.findOneBy.mockResolvedValue({id:'existing'});
    await expect(service.create('owner','trip',{...baseDto,activityId:'activity'})).rejects.toThrow('Activity already has an expense');
  });
  it('does not create balances from estimated expenses', async () => {
    const { service, expenses } = setup(); expenses.find.mockResolvedValue([{payerUserId:'owner',status:'estimated',splits:[{participantUserId:'member',amountMinor:'6000',generatesDebt:true}]}]);
    const result = await service.balances('owner','trip'); expect(result.debts).toEqual([]); expect(result.participants.every((p) => p.net === '0.00')).toBe(true);
  });
  it('reserves budget for estimated expenses without counting them as spent', async () => {
    const { service, expenses, budgets } = setup();
    expenses.find.mockResolvedValue([
      { id:'paid',payerUserId:'owner',status:'paid',category:'food',originalAmountMinor:'2000',originalCurrency:'USD',convertedAmountMinor:'2000',baseCurrency:'USD',incurredAt:new Date(),items:[],splits:[{participantUserId:'owner',amountMinor:'2000',generatesDebt:true}] },
      { id:'planned',payerUserId:'owner',status:'estimated',category:'activities',originalAmountMinor:'1500',originalCurrency:'USD',convertedAmountMinor:'1500',baseCurrency:'USD',incurredAt:new Date(),items:[],splits:[{participantUserId:'owner',amountMinor:'1500',generatesDebt:true}] },
    ]);
    budgets.findOneBy.mockResolvedValue({ amountMinor:'10000',currency:'USD' });

    const result = await service.summary('owner','trip');

    expect(result.totalSpent).toBe('20.00');
    expect(result.totalPlanned).toBe('15.00');
    expect(result.totalCommitted).toBe('35.00');
    expect(result.remaining).toBe('65.00');
    expect(result.consumedPercent).toBe(35);
  });
  it('updates splits once instead of cascading the previous relations', async () => {
    const {
      service,
      expenses,
      transactionExpenses,
      transactionSplits,
    } = setup();
    expenses.findOne.mockResolvedValue({
      id:'existing-expense',
      tripId:'trip',
      createdByUserId:'owner',
      createdAt:new Date('2026-07-19T18:00:00.000Z'),
      deletedAt:null,
      splits:[
        { id:'old-1',expenseId:'existing-expense',participantUserId:'owner',amountMinor:'6000' },
        { id:'old-2',expenseId:'existing-expense',participantUserId:'member',amountMinor:'6000' },
      ],
    });

    await service.update('owner','trip','existing-expense',baseDto);

    expect(transactionSplits.delete).toHaveBeenCalledWith({
      expenseId:'existing-expense',
    });
    expect(transactionExpenses.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ splits: expect.anything() })
    );
    expect(transactionSplits.save).toHaveBeenCalledTimes(1);
  });
  it('rebases active expenses when the new budget currency matches their original currency', async () => {
    const {
      service,
      expenses,
      transactionExpenses,
      transactionSplits,
      transactionTrips,
    } = setup();
    expenses.find.mockResolvedValue([{
      id:'expense',
      tripId:'trip',
      originalAmountMinor:'10000',
      originalCurrency:'CLP',
      convertedAmountMinor:'900000',
      baseCurrency:'USD',
      exchangeRate:'900',
      exchangeRateDate:'2026-07-19',
      exchangeRateSource:'manual',
      splits:[
        { id:'split-1',expenseId:'expense',participantUserId:'owner',amountMinor:'360000' },
        { id:'split-2',expenseId:'expense',participantUserId:'member',amountMinor:'540000' },
      ],
    }]);

    await service.upsertBudget('owner','trip',{
      amount:'100000',
      currency:'CLP',
    });

    expect(transactionTrips.save).toHaveBeenCalledWith(
      expect.objectContaining({ baseCurrency:'CLP' })
    );
    expect(transactionExpenses.save).toHaveBeenCalledWith(
      expect.objectContaining({
        baseCurrency:'CLP',
        convertedAmountMinor:'10000',
        exchangeRate:'1',
      })
    );
    expect(transactionSplits.save).toHaveBeenCalledWith([
      expect.objectContaining({ amountMinor:'4000' }),
      expect.objectContaining({ amountMinor:'6000' }),
    ]);
  });
  it('rejects a budget currency change that cannot safely rebase active expenses', async () => {
    const { service, expenses, dataSource } = setup();
    expenses.find.mockResolvedValue([{
      originalCurrency:'EUR',
      splits:[],
    }]);

    await expect(service.upsertBudget('owner','trip',{
      amount:'100000',
      currency:'CLP',
    })).rejects.toThrow(
      'Budget currency cannot change while active expenses use another currency'
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
  it('deletes the budget without deleting expenses or changing the base currency', async () => {
    const { service, budgets, trips } = setup();

    await service.removeBudget('owner','trip');

    expect(trips.assertCanEdit).toHaveBeenCalledWith('owner','trip');
    expect(budgets.delete).toHaveBeenCalledWith({ tripId:'trip' });
  });
});
