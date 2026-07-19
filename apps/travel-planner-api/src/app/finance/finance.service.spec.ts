import { BadRequestException } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateExpenseDto } from './dto/finance.dto';

const trip = { id: 'trip', userId: 'owner', baseCurrency: 'USD', startDate: null, endDate: null, members: [{ userId: 'member', role: 'editor' }] };
const baseDto: CreateExpenseDto = { title:'Dinner',amount:'120.00',currency:'USD',category:'food',incurredAt:'2026-07-19T18:00:00.000Z',payerUserId:'owner',expenseType:'shared',splitMethod:'equal',splits:[{participantUserId:'owner'},{participantUserId:'member'}],status:'paid' };

function setup() {
  const dataSource = { transaction: jest.fn(), getRepository: jest.fn(() => ({ save: jest.fn() })) };
  const trips = { assertCanEdit: jest.fn().mockResolvedValue(trip), findOne: jest.fn().mockResolvedValue(trip) };
  const expenses = { findOneBy: jest.fn(), find: jest.fn().mockResolvedValue([]), createQueryBuilder: jest.fn() };
  const budgets = { findOneBy: jest.fn().mockResolvedValue(null) };
  const settlements = { find: jest.fn().mockResolvedValue([]) };
  const rates = {}; const activities = { findOneBy: jest.fn() };
  return { service:new FinanceService(dataSource as never,trips as never,expenses as never,budgets as never,settlements as never,rates as never,activities as never), dataSource, trips, expenses, activities };
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
});
