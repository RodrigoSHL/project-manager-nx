import { randomUUID } from 'crypto';
import { DataSource, DataSourceOptions } from 'typeorm';
import { getDatabaseConfig } from '../config/database.config';
import { Project } from '../projects/entities/project.entity';
import { TeamMember } from '../projects/entities/team-member.entity';
import { Sprint } from './entities/sprint.entity';
import { SprintsService } from './sprints.service';
import { Ticket, TicketStatus } from '../tickets/entities/ticket.entity';
import { TicketsService } from '../tickets/tickets.service';
import { AddSprintCompletion1792627200000 } from '../../migrations/1792627200000-AddSprintCompletion';

const databaseUrl = process.env.SPRINT_COMPLETION_TEST_DATABASE_URL;
const postgresTests = databaseUrl ? describe : describe.skip;

postgresTests('Sprint completion (real PostgreSQL)', () => {
  const schema = `sprint_completion_${randomUUID().replace(/-/g, '')}`;
  let database: DataSource;
  let sprints: SprintsService;
  let tickets: TicketsService;
  let project: Project;
  let source: Sprint;
  let target: Sprint;
  let number = 0;
  beforeAll(async () => {
    const url = new URL(databaseUrl);
    if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.pathname !== '/sprint_completion_validation') {
      throw new Error('Tests require a disposable local sprint_completion_validation database');
    }
    database = new DataSource({
      type: 'postgres', url: databaseUrl, entities: getDatabaseConfig().entities,
      schema, synchronize: false, logging: false,
      extra: { max: 12, options: `-c search_path=${schema},public` },
    } as DataSourceOptions);
    await database.initialize();
    await database.query(`CREATE SCHEMA "${schema}"`);
    await database.synchronize();
    sprints = new SprintsService(database.getRepository(Sprint), database);
    tickets = new TicketsService(database.getRepository(Ticket), database.getRepository(TeamMember), database.getRepository(Sprint), database);
  });
  beforeEach(async () => {
    project = await database.getRepository(Project).save({ name: 'Sprint tests', key: `S${++number}`, businessUnit: 'Test', description: 'Disposable' });
    source = await sprints.create(project.id, { name: 'Current' });
    source = await sprints.activate(project.id, source.id);
    target = await sprints.create(project.id, { name: 'Next' });
  });
  afterAll(async () => {
    if (database?.isInitialized) {
      await database.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await database.destroy();
    }
  });

  it('keeps done and cancelled tickets, moves pending to backlog and persists the original snapshot', async () => {
    const done = await tickets.create(project.id, { title: 'Done', sprintId: source.id, status: TicketStatus.DONE, storyPoints: 5 });
    const cancelled = await tickets.create(project.id, { title: 'Cancelled', sprintId: source.id, status: TicketStatus.CANCELLED });
    const pending = await tickets.create(project.id, { title: 'Pending', sprintId: source.id, status: TicketStatus.IN_PROGRESS, storyPoints: 3 });
    await sprints.complete(project.id, source.id, {});
    expect(await tickets.findOne(project.id, pending.id)).toMatchObject({ sprintId: null, status: 'backlog' });
    expect(await tickets.findOne(project.id, done.id)).toMatchObject({ sprintId: source.id, status: 'done' });
    expect(await tickets.findOne(project.id, cancelled.id)).toMatchObject({ sprintId: source.id, status: 'cancelled' });
    await tickets.update(project.id, pending.id, { status: TicketStatus.DONE });
    const closed = await sprints.findOne(project.id, source.id);
    expect(closed).toMatchObject({ isActive: false, completedAt: expect.any(Date), completionSummary: { totalTickets: 3, movedTickets: 1, completedStoryPoints: 5, totalStoryPoints: 8 } });
    expect(closed.completionSummary.tickets.find(item => item.id === pending.id).status).toBe('in_progress');
  });

  it('moves to the target preserving progress, normalizing backlog and excluding cancelled work', async () => {
    const inProgress = await tickets.create(project.id, { title: 'Progress', sprintId: source.id, status: TicketStatus.IN_PROGRESS });
    const legacy = await tickets.create(project.id, { title: 'Legacy', sprintId: source.id, status: TicketStatus.BACKLOG });
    const cancelled = await tickets.create(project.id, { title: 'Cancelled', sprintId: source.id, status: TicketStatus.CANCELLED });
    await sprints.complete(project.id, source.id, { targetSprintId: target.id });
    expect(await tickets.findOne(project.id, inProgress.id)).toMatchObject({ sprintId: target.id, status: 'in_progress' });
    expect(await tickets.findOne(project.id, legacy.id)).toMatchObject({ sprintId: target.id, status: 'todo' });
    expect(await tickets.findOne(project.id, cancelled.id)).toMatchObject({ sprintId: source.id, status: 'cancelled' });
    expect((await sprints.findOne(project.id, target.id)).isActive).toBe(false);
    await expect(sprints.activate(project.id, source.id)).rejects.toThrow();
    await expect(tickets.create(project.id, { title: 'Late', sprintId: source.id })).rejects.toThrow();
  });

  it('rolls the entire close back when saving the sprint fails after moving tickets', async () => {
    const pending = await tickets.create(project.id, { title: 'Pending', sprintId: source.id, status: TicketStatus.IN_REVIEW });
    await database.query(`ALTER TABLE "sprints" ADD CONSTRAINT "test_close_failure" CHECK ("completedAt" IS NULL) NOT VALID`);
    try {
      await expect(sprints.complete(project.id, source.id, {})).rejects.toThrow();
      expect(await sprints.findOne(project.id, source.id)).toMatchObject({ isActive: true, completedAt: null, completionSummary: null });
      expect(await tickets.findOne(project.id, pending.id)).toMatchObject({ sprintId: source.id, status: 'in_review' });
    } finally {
      await database.query('ALTER TABLE "sprints" DROP CONSTRAINT "test_close_failure"');
    }
  });

  it('allows exactly one of two simultaneous closes and transfers each ticket once', async () => {
    await tickets.create(project.id, { title: 'Pending', sprintId: source.id, status: TicketStatus.TODO });
    const results = await Promise.allSettled([sprints.complete(project.id, source.id, {}), sprints.complete(project.id, source.id, { targetSprintId: target.id })]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(1);
    expect((await sprints.findOne(project.id, source.id)).completionSummary.movedTickets).toBe(1);
    expect(await database.getRepository(Ticket).countBy({ projectId: project.id, sprintId: source.id })).toBe(0);
  });

  it('serializes a close against ticket creation and reassignment so no pending ticket is stranded', async () => {
    const existing = await tickets.create(project.id, { title: 'Existing', status: TicketStatus.BACKLOG });
    const results = await Promise.allSettled([
      tickets.create(project.id, { title: 'Concurrent new', sprintId: source.id, status: TicketStatus.TODO }),
      tickets.update(project.id, existing.id, { sprintId: source.id, status: TicketStatus.TODO }),
      sprints.complete(project.id, source.id, {}),
    ]);
    expect(results[2].status).toBe('fulfilled');
    expect(await database.getRepository(Ticket).countBy({ projectId: project.id, sprintId: source.id })).toBe(0);
  });

  it('serializes activation and prevents multiple active sprints', async () => {
    const other = await sprints.create(project.id, { name: 'Other' });
    await Promise.all([sprints.activate(project.id, target.id), sprints.activate(project.id, other.id)]);
    expect(await database.getRepository(Sprint).countBy({ projectId: project.id, isActive: true })).toBe(1);
  });

  it('migration adds nullable completion columns to legacy sprints and is rerunnable', async () => {
    await database.query('ALTER TABLE "sprints" DROP COLUMN "completionSummary", DROP COLUMN "completedAt"');
    const runner = database.createQueryRunner();
    try {
      const migration = new AddSprintCompletion1792627200000();
      await migration.up(runner);
      await migration.up(runner);
      expect(await sprints.findOne(project.id, source.id)).toMatchObject({ isActive: true, completedAt: null, completionSummary: null });
      await migration.down(runner);
      await migration.up(runner);
    } finally {
      await runner.release();
    }
  });
});
