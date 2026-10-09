import { randomUUID } from 'crypto';
import { DataSource, DataSourceOptions } from 'typeorm';
import { getDatabaseConfig } from '../config/database.config';
import { Project } from '../projects/entities/project.entity';
import { TeamMember } from '../projects/entities/team-member.entity';
import { Sprint } from '../sprints/entities/sprint.entity';
import { Ticket, TicketType } from './entities/ticket.entity';
import { TicketsService } from './tickets.service';
import { AddProjectTicketCounter1791547200000 } from '../../migrations/1791547200000-AddProjectTicketCounter';

// Run against a disposable PostgreSQL database, never production:
// TICKET_COUNTER_TEST_DATABASE_URL=postgres://... npx jest --config apps/project-api/jest.config.ts --runInBand
const databaseUrl = process.env.TICKET_COUNTER_TEST_DATABASE_URL;
const postgresTests = databaseUrl ? describe : describe.skip;

postgresTests('Ticket counter (real PostgreSQL)', () => {
  const schema = `ticket_counter_${randomUUID().replace(/-/g, '')}`;
  let database: DataSource;
  let service: TicketsService;
  let project: Project;
  let projectNumber = 0;

  const counter = async () => {
    const [row] = await database.query(
      'SELECT "lastTicketNumber" FROM "projects" WHERE id = $1', [project.id],
    );
    return row.lastTicketNumber;
  };

  const migrate = async () => {
    const runner = database.createQueryRunner();
    await runner.startTransaction();
    try {
      await new AddProjectTicketCounter1791547200000().up(runner);
      await runner.commitTransaction();
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  };

  beforeAll(async () => {
    const target = new URL(databaseUrl);
    if (!['localhost', '127.0.0.1'].includes(target.hostname)
      || target.pathname !== '/ticket_counter_validation') {
      throw new Error('Ticket counter tests require the disposable local ticket_counter_validation database');
    }
    database = new DataSource({
      type: 'postgres', url: databaseUrl,
      entities: getDatabaseConfig().entities,
      schema, synchronize: false, logging: false,
      extra: { max: 20, options: `-c search_path=${schema},public` },
    } as DataSourceOptions);
    await database.initialize();
    await database.query(`CREATE SCHEMA "${schema}"`);
    await database.synchronize();
    service = new TicketsService(
      database.getRepository(Ticket), database.getRepository(TeamMember),
      database.getRepository(Sprint), database,
    );
  });

  beforeEach(async () => {
    project = await database.getRepository(Project).save({
      name: 'Counter validation', businessUnit: 'Test', description: 'Disposable test',
      key: `T${++projectNumber}`,
    });
  });

  afterAll(async () => {
    if (database?.isInitialized) {
      await database.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await database.destroy();
    }
  });

  it('adds the column and seeds sparse legacy ticket numbers without changing keys', async () => {
    const tickets = database.getRepository(Ticket);
    await tickets.save([
      tickets.create({ projectId: project.id, key: `${project.key}-35`, title: 'Legacy 35' }),
      tickets.create({ projectId: project.id, key: `${project.key}-44`, title: 'Legacy 44' }),
    ]);
    await database.query('ALTER TABLE "projects" DROP COLUMN "lastTicketNumber"');
    await migrate();
    expect(await counter()).toBe(44);
    expect((await service.create(project.id, { title: 'After gaps' })).key).toBe(`${project.key}-45`);
    expect((await tickets.findBy({ projectId: project.id })).map(ticket => ticket.key).sort())
      .toEqual([`${project.key}-35`, `${project.key}-44`, `${project.key}-45`]);
    await migrate();
    expect(await counter()).toBe(45);
    const runner = database.createQueryRunner();
    try {
      await new AddProjectTicketCounter1791547200000().down(runner);
      expect(await tickets.countBy({ projectId: project.id })).toBe(3);
    } finally {
      await runner.release();
      await migrate();
    }
    expect(await counter()).toBe(45);
  });

  it('starts an empty project at one and hides the internal counter on project reads', async () => {
    expect((await service.create(project.id, { title: 'First' })).key).toBe(`${project.key}-1`);
    expect(await database.getRepository(Project).findOneBy({ id: project.id }))
      .not.toHaveProperty('lastTicketNumber');
  });

  it('does not reuse a deleted highest number, even if the migration runs again', async () => {
    const first = await service.create(project.id, { title: 'Delete me' });
    await service.remove(project.id, first.id);
    await migrate();
    expect((await service.create(project.id, { title: 'Next' })).key).toBe(`${project.key}-2`);
  });

  it('allocates distinct consecutive numbers to simultaneous requests', async () => {
    const results = await Promise.all(Array.from({ length: 12 }, (_, i) =>
      service.create(project.id, { title: `Concurrent ${i}` }),
    ));
    expect(new Set(results.map(ticket => ticket.key)).size).toBe(12);
    expect(results.map(ticket => Number(ticket.key.split('-').pop())).sort((a, b) => a - b))
      .toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
    expect(await counter()).toBe(12);
  });

  it('rolls back the counter when the ticket insert fails', async () => {
    await expect(service.create(project.id, { title: 'x'.repeat(501) })).rejects.toThrow();
    expect(await counter()).toBe(0);
    expect(await database.getRepository(Ticket).countBy({ projectId: project.id })).toBe(0);
    expect((await service.create(project.id, { title: 'Retry' })).key).toBe(`${project.key}-1`);
  });

  it('rolls back the ticket and counter when support detail creation fails', async () => {
    await database.query(`ALTER TABLE "ticket_support_details"
      ADD CONSTRAINT "test_support_failure" CHECK ("isBillable" = false)`);
    try {
      await expect(service.create(project.id, { title: 'Support', type: TicketType.SUPPORT })).rejects.toThrow();
      expect(await counter()).toBe(0);
      expect(await database.getRepository(Ticket).countBy({ projectId: project.id })).toBe(0);
    } finally {
      await database.query('ALTER TABLE "ticket_support_details" DROP CONSTRAINT "test_support_failure"');
    }
  });
});
