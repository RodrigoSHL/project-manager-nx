import {
  customTrainingExerciseSchema,
  trainingDraftStateSchema,
  trainingFinishStateSchema,
  trainingHistorySchema,
  trainingWorkspaceSchema,
  type FinishTraining,
  type SaveTrainingDraft,
  type TrainingExercise,
} from '@project-manager/macrofit-contracts';
import type { ZodType } from 'zod';
import { macrofitRecordsRequest } from '../../utils/macrofitRecordsRequest';

async function request<T>(
  schema: ZodType<T>,
  path = '',
  method = 'GET',
  body?: unknown
): Promise<T> {
  const response = await macrofitRecordsRequest(
    `/training${path}`,
    method,
    body
  );
  const parsed = schema.safeParse(response);
  if (!parsed.success)
    throw new Error(
      'El servidor no entregó un registro de entrenamiento válido.'
    );
  return parsed.data;
}

export const trainingApi = {
  workspace: () => request(trainingWorkspaceSchema),
  saveDraft: (data: SaveTrainingDraft) =>
    request(trainingDraftStateSchema, '/draft', 'PUT', data),
  finish: (data: FinishTraining) =>
    request(trainingFinishStateSchema, '/finish', 'POST', data),
  createExercise: (data: TrainingExercise) =>
    request(customTrainingExerciseSchema, '/exercises', 'POST', data),
  history: (offset: number) =>
    request(trainingHistorySchema, `/history?offset=${offset}`),
};
