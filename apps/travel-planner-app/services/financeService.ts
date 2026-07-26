import { getAuthHeaders } from '@/lib/auth';
import type { BalanceSummary, Budget, Expense, ExpenseInput, FinanceSummary } from '@/lib/finance';
const base='/api/trips';
async function response<T>(res:Response):Promise<T>{ if(res.status===204)return undefined as T; const body=await res.json().catch(()=>null); if(!res.ok)throw new Error(Array.isArray(body?.message)?body.message[0]:body?.message??`Error ${res.status}`); return body; }
function init(method?:string,body?:unknown):RequestInit{return {method,credentials:'include',cache:'no-store',headers:{...getAuthHeaders(),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined};}
export async function getFinanceSummary(tripId:string){return response<FinanceSummary>(await fetch(`${base}/${tripId}/finance/summary`,init()));}
export async function getBudget(tripId:string){return response<Budget>(await fetch(`${base}/${tripId}/finance/budget`,init()));}
export async function saveBudget(tripId:string,data:{amount:string;currency:string;alertThresholds:number[]}){return response<Budget>(await fetch(`${base}/${tripId}/finance/budget`,init('PUT',data)));}
export async function deleteBudget(tripId:string){return response<void>(await fetch(`${base}/${tripId}/finance/budget`,init('DELETE')));}
export async function getExpenses(tripId:string,params:URLSearchParams){return response<{items:Expense[];total:number;page:number;limit:number}>(await fetch(`${base}/${tripId}/finance/expenses?${params}`,init()));}
export async function createExpense(tripId:string,data:ExpenseInput){return response<Expense>(await fetch(`${base}/${tripId}/finance/expenses`,init('POST',data)));}
export async function updateExpense(tripId:string,id:string,data:ExpenseInput){return response<Expense>(await fetch(`${base}/${tripId}/finance/expenses/${id}`,init('PATCH',data)));}
export async function deleteExpense(tripId:string,id:string){return response<void>(await fetch(`${base}/${tripId}/finance/expenses/${id}`,init('DELETE')));}
export async function duplicateExpense(tripId:string,id:string){return response<Expense>(await fetch(`${base}/${tripId}/finance/expenses/${id}/duplicate`,init('POST',{})));}
export async function getBalances(tripId:string){return response<BalanceSummary>(await fetch(`${base}/${tripId}/finance/balances`,init()));}
export async function createSettlement(tripId:string,data:{fromUserId:string;toUserId:string;amount:string;currency:string;settledAt:string;note?:string}){return response(await fetch(`${base}/${tripId}/finance/settlements`,init('POST',data)));}
