import { randomUUID } from 'crypto';
import { DataSource, DataSourceOptions } from 'typeorm';
import { getDatabaseConfig } from '../config/database.config';
import { Project } from '../projects/entities/project.entity';
import { TeamMember } from '../projects/entities/team-member.entity';
import { Sprint } from '../sprints/entities/sprint.entity';
import { Ticket, TicketType, TicketStatus } from './entities/ticket.entity';
import { TicketsService } from './tickets.service';
import { AddStorySubtaskTickets1793491200000 } from '../../migrations/1793491200000-AddStorySubtaskTickets';

const databaseUrl = process.env.STORY_SUBTASKS_TEST_DATABASE_URL;
const postgresTests = databaseUrl ? describe : describe.skip;

postgresTests('Story subtasks (real PostgreSQL)', () => {
  const schema = `story_subtasks_${randomUUID().replace(/-/g, '')}`;
  let database: DataSource;
  let service: TicketsService;
  let project: Project;
  let epic: Ticket;
  let first: Ticket;
  let second: Ticket;
  let number = 0;

  beforeAll(async () => {
    const target = new URL(databaseUrl);
    if (!['localhost', '127.0.0.1'].includes(target.hostname) || target.pathname !== '/story_subtasks_validation') {
      throw new Error('Tests require a disposable local story_subtasks_validation database');
    }
    database = new DataSource({
      type: 'postgres', url: databaseUrl, entities: getDatabaseConfig().entities, schema,
      synchronize: false, logging: false, extra: { max: 8, options: `-c search_path=${schema},public` },
    } as DataSourceOptions);
    await database.initialize();
    await database.query(`CREATE SCHEMA "${schema}"`);
    await database.synchronize();
    service = new TicketsService(database.getRepository(Ticket), database.getRepository(TeamMember), database.getRepository(Sprint), database);
  });

  beforeEach(async () => {
    project = await database.getRepository(Project).save({ name: 'Hierarchy validation', businessUnit: 'Test', description: 'Disposable', key: `H${++number}` });
    epic = await service.create(project.id, { title: 'Epic', type: TicketType.EPIC });
    first = await service.create(project.id, { title: 'First story', type: TicketType.STORY, epicId: epic.id });
    second = await service.create(project.id, { title: 'Second story', type: TicketType.STORY, epicId: epic.id });
  });

  afterAll(async () => {
    if (database?.isInitialized) {
      await database.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await database.destroy();
    }
  });

  it('migrates existing tickets without assigning a parent to legacy subtasks', async () => {
    const legacy = await database.getRepository(Ticket).save({ projectId: project.id, key: `${project.key}-99`, title: 'Legacy subtask', type: TicketType.SUBTASK });
    await database.query('ALTER TABLE "tickets" DROP COLUMN "parentTicketId" CASCADE');
    const runner = database.createQueryRunner();
    try { await new AddStorySubtaskTickets1793491200000().up(runner); } finally { await runner.release(); }
    expect(await service.findOne(project.id, legacy.id)).toMatchObject({ key: legacy.key, parentTicketId: null });
    expect(await service.findOne(project.id, first.id)).toMatchObject({ epicId: epic.id, parentTicketId: null });
  });

  it('persists, reloads, reassigns and detaches a child through the ticket service', async () => {
    const child = await service.create(project.id, { title: 'Child', type: TicketType.SUBTASK, parentTicketId: first.id });
    expect(child.key).toBe(`${project.key}-4`);
    expect(await service.findOne(project.id, child.id)).toMatchObject({ type: TicketType.SUBTASK, parentTicketId: first.id });
    await service.update(project.id, child.id, { parentTicketId: second.id });
    expect(await service.findOne(project.id, child.id)).toMatchObject({ parentTicketId: second.id });
    await service.update(project.id, child.id, { status: TicketStatus.DONE });
    expect((await service.findByProject(project.id)).find(item => item.id === child.id)).toMatchObject({ parentTicketId: second.id, status: TicketStatus.DONE });
    await service.update(project.id, child.id, { type: TicketType.TASK });
    expect(await service.findOne(project.id, child.id)).toMatchObject({ type: TicketType.TASK, parentTicketId: null });
  });

  it('rejects parents of another type or project, and does not consume a ticket number', async () => {
    const foreignProject = await database.getRepository(Project).save({ name: 'Other', businessUnit: 'Test', description: 'Other', key: `F${number}` });
    const foreignEpic = await service.create(foreignProject.id, { title: 'Other epic', type: TicketType.EPIC });
    const foreignStory = await service.create(foreignProject.id, { title: 'Other story', type: TicketType.STORY, epicId: foreignEpic.id });
    for (const parentTicketId of [epic.id, foreignStory.id, randomUUID()]) {
      await expect(service.create(project.id, { title: 'Invalid', type: TicketType.SUBTASK, parentTicketId })).rejects.toThrow('historia seleccionada');
    }
    const child = await service.create(project.id, { title: 'Valid', type: TicketType.SUBTASK, parentTicketId: first.id });
    expect(child.key).toBe(`${project.key}-4`);
  });

  it('protects a story with children and allows deletion after reassignment', async () => {
    const child = await service.create(project.id, { title: 'Child', type: TicketType.SUBTASK, parentTicketId: first.id });
    await expect(service.remove(project.id, first.id)).rejects.toThrow('subtareas vinculadas');
    await expect(service.update(project.id, first.id, { type: TicketType.TASK })).rejects.toThrow('subtareas vinculadas');
    await service.update(project.id, child.id, { parentTicketId: second.id });
    await service.remove(project.id, first.id);
    expect(await service.findOne(project.id, child.id)).toMatchObject({ parentTicketId: second.id });
  });

  it('keeps the epic association when moving a story between epics', async () => {
    const otherEpic = await service.create(project.id, { title: 'Other epic', type: TicketType.EPIC });
    await service.update(project.id, first.id, { epicId: otherEpic.id });
    expect(await service.findOne(project.id, first.id)).toMatchObject({ epicId: otherEpic.id, epic: { id: otherEpic.id } });
  });

  it('serializes child creation against changing its parent story type', async () => {
    const results = await Promise.allSettled([
      service.create(project.id, { title: 'Concurrent child', type: TicketType.SUBTASK, parentTicketId: first.id }),
      service.update(project.id, first.id, { type: TicketType.TASK }),
    ]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    const parent = await service.findOne(project.id, first.id);
    const children = (await service.findByProject(project.id)).filter(ticket => ticket.parentTicketId === first.id);
    expect(parent.type === TicketType.STORY ? children.length === 1 : children.length === 0).toBe(true);
  });
});
