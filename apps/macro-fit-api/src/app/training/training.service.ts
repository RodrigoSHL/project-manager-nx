import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  TRAINING_CATALOG,
  TRAINING_HISTORY_PAGE_SIZE,
  type CompletedTraining,
  type FinishTraining,
  type SaveTrainingDraft,
  type TrainingDraft,
  type TrainingDraftState,
  type TrainingExercise,
  type TrainingHistory,
  type TrainingWorkspace,
} from '@project-manager/macrofit-contracts';
import {
  TrainingDraftEntity,
  TrainingExerciseEntity,
  TrainingSessionEntity,
} from './training.entity';

const historyOrder = { finishedAt: 'DESC', id: 'DESC' } as const;

function draftState(row: TrainingDraftEntity | null): TrainingDraftState {
  return { draft: row?.draft ?? null, revision: row?.revision ?? 0 };
}

@Injectable()
export class TrainingService {
  constructor(private readonly db: DataSource) {}

  async workspace(userId: string): Promise<TrainingWorkspace> {
    const row = await this.db
      .getRepository(TrainingDraftEntity)
      .findOneBy({ userId });
    const [customExercises, lastCompleted] = await Promise.all([
      this.customExercises(this.db.manager, userId),
      this.latestSession(this.db.manager, userId),
    ]);
    return {
      ...draftState(row),
      customExercises,
      lastCompleted,
    };
  }

  async saveDraft(userId: string, { revision, draft }: SaveTrainingDraft) {
    return this.db.transaction(async (manager) => {
      const row = await this.lockDraft(manager, userId);
      this.checkRevision(row, revision);
      if (row.draft && row.draft.id !== draft.id) {
        throw new ConflictException('Ya tienes otra sesión activa.');
      }
      if (
        !row.draft &&
        (await manager.existsBy(TrainingSessionEntity, {
          userId,
          id: draft.id,
        }))
      ) {
        throw new ConflictException('Esta sesión ya fue finalizada.');
      }
      await this.resolveExercises(manager, userId, draft);
      row.draft = {
        ...draft,
        startedAt: row.draft?.startedAt ?? draft.startedAt,
      };
      row.revision += 1;
      await manager.save(row);
      return draftState(row);
    });
  }

  async finish(userId: string, { revision, id }: FinishTraining) {
    return this.db.transaction(async (manager) => {
      const row = await this.lockDraft(manager, userId);
      if (await manager.existsBy(TrainingSessionEntity, { userId, id })) {
        return {
          ...draftState(row),
          lastCompleted: await this.latestSession(manager, userId),
        };
      }
      this.checkRevision(row, revision);
      if (!row.draft || row.draft.id !== id) {
        throw new ConflictException('La sesión activa cambió.');
      }

      const exercises = (
        await this.resolveExercises(manager, userId, row.draft)
      ).filter(({ sets }) => sets.length > 0);
      if (exercises.length === 0) {
        throw new BadRequestException(
          'Registra al menos una serie para finalizar.'
        );
      }
      const finishedAt = new Date();
      const data: CompletedTraining = {
        id,
        startedAt: row.draft.startedAt,
        finishedAt: finishedAt.toISOString(),
        exercises,
      };
      await manager
        .getRepository(TrainingSessionEntity)
        .insert({ userId, id, finishedAt, data });
      row.draft = null;
      row.revision += 1;
      await manager.save(row);
      return { ...draftState(row), lastCompleted: data };
    });
  }

  async history(userId: string, offset: number): Promise<TrainingHistory> {
    const rows = await this.db.getRepository(TrainingSessionEntity).find({
      where: { userId },
      order: historyOrder,
      take: TRAINING_HISTORY_PAGE_SIZE + 1,
      skip: offset,
    });
    return {
      sessions: rows
        .slice(0, TRAINING_HISTORY_PAGE_SIZE)
        .map(({ data }) => data),
      nextOffset:
        rows.length > TRAINING_HISTORY_PAGE_SIZE
          ? offset + TRAINING_HISTORY_PAGE_SIZE
          : null,
    };
  }

  private async latestSession(manager: EntityManager, userId: string) {
    const row = await manager.getRepository(TrainingSessionEntity).findOne({
      where: { userId },
      order: historyOrder,
    });
    return row?.data ?? null;
  }

  async createExercise(userId: string, exercise: TrainingExercise) {
    const repository = this.db.getRepository(TrainingExerciseEntity);
    const { id } = exercise;
    await repository
      .createQueryBuilder()
      .insert()
      .values({ userId, id, data: exercise })
      .orIgnore()
      .execute();
    const row = await repository.findOneByOrFail({ userId, id });
    return row.data;
  }

  private async lockDraft(manager: EntityManager, userId: string) {
    const repository = manager.getRepository(TrainingDraftEntity);
    await repository
      .createQueryBuilder()
      .insert()
      .values({ userId })
      .orIgnore()
      .execute();
    return repository.findOneOrFail({
      where: { userId },
      lock: { mode: 'pessimistic_write' },
    });
  }

  private checkRevision(row: TrainingDraftEntity, revision: number) {
    if (row.revision !== revision) {
      throw new ConflictException(
        'La sesión cambió en otro dispositivo. Actualiza para continuar.'
      );
    }
  }

  private async customExercises(manager: EntityManager, userId: string) {
    const rows = await manager
      .getRepository(TrainingExerciseEntity)
      .findBy({ userId });
    return rows.map(({ data }) => data);
  }

  private async resolveExercises(
    manager: EntityManager,
    userId: string,
    draft: TrainingDraft
  ) {
    const catalog = new Map(
      [
        ...TRAINING_CATALOG,
        ...(await this.customExercises(manager, userId)),
      ].map((exercise) => [exercise.id, exercise])
    );
    return draft.exercises.map(({ exerciseId, sets }) => {
      const exercise = catalog.get(exerciseId);
      if (!exercise)
        throw new BadRequestException(
          'Un ejercicio no pertenece a tu catálogo.'
        );
      return { exercise, sets };
    });
  }
}
