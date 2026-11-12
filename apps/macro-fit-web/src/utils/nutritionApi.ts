import {
  equivalenceSuggestionsSchema,
  dailyLogSchema,
  nutritionAccountSchema,
  productEquivalenceResultSchema,
  dashboardResponseSchema,
} from '../types/nutrition';
import { macrofitRecordsRequest } from './macrofitRecordsRequest';

export async function nutritionRequest<T>(
  path: string,
  method = 'GET',
  body?: unknown,
  signal?: AbortSignal
): Promise<T> {
  const data = await macrofitRecordsRequest(path, method, body, signal);
  const parsed = (
    path.startsWith('/dashboard?')
      ? dashboardResponseSchema
      : path.endsWith('/equivalence-suggestions')
      ? equivalenceSuggestionsSchema
      : path.endsWith('/product-equivalence') ||
        (path.startsWith('/days/') && path.endsWith('/equivalence'))
      ? productEquivalenceResultSchema
      : path.startsWith('/days/')
      ? dailyLogSchema
      : nutritionAccountSchema
  ).safeParse(data);
  if (!parsed.success)
    throw new Error('El servidor no entregó registros válidos.');
  return parsed.data as T;
}
