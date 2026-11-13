import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import {
  trainingFinishStateSchema,
  trainingEditResultSchema,
  trainingHistorySchema,
  trainingWorkspaceSchema,
  type TrainingDraft,
  type TrainingExercise,
} from '@project-manager/macrofit-contracts';
import { CreateTrainingRecords1794484800000 } from '../../migrations/1794484800000-CreateTrainingRecords';
import { DateTrainingSessions1794488400000 } from '../../migrations/1794488400000-DateTrainingSessions';
import { TrainingController } from './training.controller';
import {
  TrainingDraftEntity,
  TrainingExerciseEntity,
  TrainingSessionEntity,
} from './training.entity';
import { TrainingService } from './training.service';

const url = process.env.MACROFIT_TEST_DATABASE_URL;
if (url && !new URL(url).pathname.startsWith('/macrofit_test'))
  throw new Error('Use a disposable macrofit_test database.');

(url ? describe : describe.skip)(
  'Muscle Log PostgreSQL and HTTP integration',
  () => {
    const user = randomUUID();
    const otherUser = randomUUID();
    const legacyUser = randomUUID();
    const legacySession = {
      id: randomUUID(),
      startedAt: '2026-11-08T01:00:00.000Z',
      finishedAt: '2026-11-08T01:30:00.000Z',
      exercises: [],
    };
    const db = new DataSource({
      type: 'postgres',
      url,
      entities: [
        TrainingDraftEntity,
        TrainingSessionEntity,
        TrainingExerciseEntity,
      ],
      migrations: [
        CreateTrainingRecords1794484800000,
        DateTrainingSessions1794488400000,
      ],
      migrationsTableName: 'training_test_migrations',
    });
    let app: INestApplication;
    let origin: string;
    beforeAll(async () => {
      await db.initialize();
      await db.runMigrations();
      await db.undoLastMigration();
      await db.query(
        'INSERT INTO training_sessions (user_id, id, finished_at, data) VALUES ($1, $2, $3, $4)',
        [
          legacyUser,
          legacySession.id,
          legacySession.finishedAt,
          JSON.stringify(legacySession),
        ]
      );
      await db.runMigrations();
      const module = await Test.createTestingModule({
        controllers: [TrainingController],
        providers: [TrainingService, { provide: DataSource, useValue: db }],
      }).compile();
      app = module.createNestApplication();
      await app.listen(0, '127.0.0.1');
      origin = (await app.getUrl()) + '/me/training';
    });
    afterAll(async () => {
      await app?.close();
      if (db.isInitialized) await db.destroy();
    });
    const call = (path = '', id = user, method = 'GET', data?: unknown) =>
      fetch(origin + path, {
        method,
        headers: { 'x-user-id': id, 'Content-Type': 'application/json' },
        ...(data !== undefined && { body: JSON.stringify(data) }),
      });

    it('keeps legacy sessions, orders backdated sessions and applies private versioned edits', async () => {
      expect((await fetch(origin)).status).toBe(401);
      const legacyHistory = trainingHistorySchema.parse(
        await (await call('/history', legacyUser)).json()
      );
      expect(legacyHistory.sessions).toEqual([
        { ...legacySession, performedOn: '2026-11-07', revision: 0 },
      ]);
      const exercise: TrainingExercise = {
        id: randomUUID(),
        name: 'Flexión de prueba',
        aliases: [],
        equipment: 'bodyweight',
        primary: ['chest'],
        secondary: ['triceps'],
      };
      expect((await call('/exercises', user, 'POST', exercise)).status).toBe(
        201
      );
      const draft: TrainingDraft = {
        id: randomUUID(),
        startedAt: new Date().toISOString(),
        performedOn: '2026-11-09',
        exercises: [
          {
            exerciseId: exercise.id,
            sets: [{ id: randomUUID(), reps: 10, weightKg: 0 }],
          },
        ],
      };
      expect(
        (await call('/draft', otherUser, 'PUT', { draft, revision: 0 })).status
      ).toBe(400);
      const contenders = await Promise.all([
        call('/draft', user, 'PUT', { draft, revision: 0 }),
        call('/draft', user, 'PUT', { draft, revision: 0 }),
      ]);
      expect(contenders.map(({ status }) => status).sort()).toEqual([200, 409]);
      const reloaded = trainingWorkspaceSchema.parse(
        await (await call()).json()
      );
      expect(reloaded).toEqual({
        draft,
        revision: 1,
        customExercises: [exercise],
        lastCompleted: null,
      });
      expect(
        trainingWorkspaceSchema.parse(await (await call('', otherUser)).json())
      ).toEqual({
        draft: null,
        revision: 0,
        customExercises: [],
        lastCompleted: null,
      });
      const finish = { id: draft.id, revision: reloaded.revision };
      for (let attempt = 0; attempt < 2; attempt++) {
        const result = await call('/finish', user, 'POST', finish);
        expect(result.status).toBe(200);
        expect(
          trainingFinishStateSchema.parse(await result.json())
        ).toMatchObject({
          draft: null,
          revision: 2,
          lastCompleted: {
            id: draft.id,
            exercises: [{ exercise, sets: draft.exercises[0].sets }],
          },
        });
      }
      expect(
        (await call('/draft', user, 'PUT', { draft, revision: 2 })).status
      ).toBe(409);
      const history = trainingHistorySchema.parse(
        await (await call('/history')).json()
      );
      expect(history.sessions).toHaveLength(1);
      expect(history.sessions[0]).toMatchObject({
        id: draft.id,
        startedAt: draft.startedAt,
        exercises: [{ exercise, sets: draft.exercises[0].sets }],
      });
      expect(
        trainingWorkspaceSchema.parse(await (await call()).json()).lastCompleted
      ).toEqual(history.sessions[0]);
      expect(
        trainingWorkspaceSchema.parse(await (await call('', otherUser)).json())
          .lastCompleted
      ).toBeNull();
      expect(
        trainingHistorySchema.parse(
          await (await call('/history', otherUser)).json()
        ).sessions
      ).toEqual([]);
      const another = {
        ...draft,
        id: randomUUID(),
        performedOn: '2026-11-04',
        exercises: [],
      };
      expect(
        (await call('/draft', user, 'PUT', { draft: another, revision: 2 }))
          .status
      ).toBe(200);
      expect(
        (await call('/finish', user, 'POST', { id: another.id, revision: 3 }))
          .status
      ).toBe(400);
      expect(
        (
          await call('/draft', user, 'PUT', {
            revision: 3,
            draft: { ...another, exercises: draft.exercises },
          })
        ).status
      ).toBe(200);
      const backdated = await call('/finish', user, 'POST', {
        id: another.id,
        revision: 4,
      });
      expect(backdated.status).toBe(200);
      expect(
        trainingFinishStateSchema.parse(await backdated.json()).lastCompleted
          ?.id
      ).toBe(draft.id);
      const active = { ...another, id: randomUUID() };
      expect(
        (await call('/draft', user, 'PUT', { draft: active, revision: 5 }))
          .status
      ).toBe(200);

      const editPath = `/history/${draft.id}`;
      const edit = {
        revision: 0,
        performedOn: '2026-11-02',
        exercises: [
          {
            exerciseId: exercise.id,
            sets: [{ ...draft.exercises[0].sets[0], weightKg: 4 }],
          },
        ],
      };
      expect((await call(editPath, otherUser, 'PUT', edit)).status).toBe(404);
      const update = await call(editPath, user, 'PUT', edit);
      expect(update.status).toBe(200);
      const changed = trainingEditResultSchema.parse(await update.json());
      expect(changed.session).toMatchObject({
        id: draft.id,
        revision: 1,
        performedOn: edit.performedOn,
        finishedAt: history.sessions[0].finishedAt,
        exercises: [{ exercise, sets: edit.exercises[0].sets }],
      });
      expect(changed.lastCompleted?.id).toBe(another.id);
      expect((await call(editPath, user, 'PUT', edit)).status).toBe(409);
      const ordered = trainingHistorySchema.parse(
        await (await call('/history')).json()
      );
      expect(ordered.sessions.map(({ id }) => id)).toEqual([
        another.id,
        draft.id,
      ]);
      expect(
        trainingWorkspaceSchema.parse(await (await call()).json()).draft
      ).toEqual(active);
    });
  }
);
