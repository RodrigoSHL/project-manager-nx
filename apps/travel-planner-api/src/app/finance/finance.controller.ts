import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, RequestUser } from '../decorators/current-user.decorator';
import { InternalAuthGuard } from '../guards/internal-auth.guard';
import { BudgetDto, CreateExpenseDto, CreateSettlementDto, ExchangeRateDto, ExpenseQueryDto } from './dto/finance.dto';
import { FinanceService } from './finance.service';

@UseGuards(InternalAuthGuard)
@Controller('trips/:tripId/finance')
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}
  @Get('budget') budget(@CurrentUser() u:RequestUser,@Param('tripId') tripId:string){ return this.finance.getBudget(u.id,tripId); }
  @Put('budget') saveBudget(@CurrentUser() u:RequestUser,@Param('tripId') tripId:string,@Body() dto:BudgetDto){ return this.finance.upsertBudget(u.id,tripId,dto); }
  @Delete('budget') @HttpCode(HttpStatus.NO_CONTENT) deleteBudget(@CurrentUser() u:RequestUser,@Param('tripId') tripId:string){ return this.finance.removeBudget(u.id,tripId); }
  @Get('expenses') list(@CurrentUser() u:RequestUser,@Param('tripId') tripId:string,@Query() query:ExpenseQueryDto){ return this.finance.list(u.id,tripId,query); }
  @Post('expenses') create(@CurrentUser() u:RequestUser,@Param('tripId') tripId:string,@Body() dto:CreateExpenseDto){ return this.finance.create(u.id,tripId,dto); }
  @Patch('expenses/:id') update(@CurrentUser() u:RequestUser,@Param('tripId') tripId:string,@Param('id') id:string,@Body() dto:CreateExpenseDto){ return this.finance.update(u.id,tripId,id,dto); }
  @Delete('expenses/:id') @HttpCode(HttpStatus.NO_CONTENT) remove(@CurrentUser() u:RequestUser,@Param('tripId') tripId:string,@Param('id') id:string){ return this.finance.remove(u.id,tripId,id); }
  @Post('expenses/:id/duplicate') duplicate(@CurrentUser() u:RequestUser,@Param('tripId') tripId:string,@Param('id') id:string){ return this.finance.duplicate(u.id,tripId,id); }
  @Get('summary') summary(@CurrentUser() u:RequestUser,@Param('tripId') tripId:string){ return this.finance.summary(u.id,tripId); }
  @Get('balances') balances(@CurrentUser() u:RequestUser,@Param('tripId') tripId:string){ return this.finance.balances(u.id,tripId); }
  @Post('settlements') settlement(@CurrentUser() u:RequestUser,@Param('tripId') tripId:string,@Body() dto:CreateSettlementDto){ return this.finance.createSettlement(u.id,tripId,dto); }
  @Post('settlements/:id/void') voidSettlement(@CurrentUser() u:RequestUser,@Param('tripId') tripId:string,@Param('id') id:string){ return this.finance.voidSettlement(u.id,tripId,id); }
  @Get('rates') rates(@CurrentUser() u:RequestUser,@Param('tripId') tripId:string){ return this.finance.listRates(u.id,tripId); }
  @Post('rates') rate(@CurrentUser() u:RequestUser,@Param('tripId') tripId:string,@Body() dto:ExchangeRateDto){ return this.finance.recordRate(u.id,tripId,dto); }
}
