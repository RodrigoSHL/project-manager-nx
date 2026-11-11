import { randomUUID } from 'node:crypto';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AddTicketDependencies1794358800000 } from '../../migrations/1794358800000-AddTicketDependencies';
import { getDatabaseConfig } from '../config/database.config';
import { Project } from '../projects/entities/project.entity';
import { TicketDependency } from './entities/ticket-dependency.entity';
import { Ticket, TicketType } from './entities/ticket.entity';
import { TicketDependenciesService } from './ticket-dependencies.service';

const databaseUrl = process.env.TICKET_DEPENDENCIES_TEST_DATABASE_URL;
const postgresTests = databaseUrl ? describe : describe.skip;

postgresTests('Ticket dependencies (real PostgreSQL)', () => {
  const schema = `dependencies_${randomUUID().replace(/-/g, '')}`;
  let database: DataSource;
  let service: TicketDependenciesService;
  let projectId: string;
  let otherProjectId: string;
  let x: Ticket;
  let y: Ticket;
  let z: Ticket;
  let foreign: Ticket;

  beforeAll(async () => {
    const url = new URL(databaseUrl);
    if (
      !['localhost', '127.0.0.1'].includes(url.hostname) ||
      url.pathname !== '/ticket_dependencies_validation'
    ) {
      throw new Error(
        'Use a disposable local ticket_dependencies_validation database'
      );
    }
    const entities = Object.values(getDatabaseConfig().entities ?? {});
    const options: DataSourceOptions = {
      type: 'postgres',
      url: databaseUrl,
      schema,
      extra: { options: `-c search_path=${schema},public` },
    };
    const baseline = await new DataSource({
      ...options,
      entities: entities.filter((entity) => entity !== TicketDependency),
    }).initialize();
    try {
      await baseline.query(`CREATE SCHEMA "${schema}"`);
      await baseline.synchronize();
      const runner = baseline.createQueryRunner();
      try {
        await new AddTicketDependencies1794358800000().up(runner);
      } finally {
        await runner.release();
      }
    } finally {
      await baseline.destroy();
    }
    database = await new DataSource({
      ...options,
      entities,
    }).initialize();
    service = new TicketDependenciesService(database);
    const projects = database.getRepository(Project);
    projectId = (
      await projects.save({
        name: 'Test',
        key: 'QA',
        description: 'Test',
        businessUnit: 'QA',
      })
    ).id;
    otherProjectId = (
      await projects.save({
        name: 'Other',
        key: 'OTH',
        description: 'Test',
        businessUnit: 'QA',
      })
    ).id;
  });

  beforeEach(async () => {
    const tickets = database.getRepository(Ticket);
    const suffix = randomUUID().slice(0, 6);
    [x, y, z, foreign] = await tickets.save([
      {
        projectId,
        key: `QA-1-${suffix}`,
        title: 'HDU X',
        type: TicketType.STORY,
      },
      {
        projectId,
        key: `QA-2-${suffix}`,
        title: 'HDU Y',
        type: TicketType.STORY,
      },
      {
        projectId,
        key: `QA-3-${suffix}`,
        title: 'HDU Z',
        type: TicketType.STORY,
      },
      {
        projectId: otherProjectId,
        key: `OTH-1-${suffix}`,
        title: 'Foreign ticket',
      },
    ]);
  });

  afterAll(async () => {
    if (database?.isInitialized) {
      await database.query(`DROP SCHEMA "${schema}" CASCADE`);
      await database.destroy();
    }
  });

  it('reads both directions, deduplicates retries and removes a dependency', async () => {
    await service.add(projectId, x.id, y.id);
    await service.add(projectId, x.id, y.id);
    expect(await service.list(projectId, x.id)).toEqual({
      dependsOn: [{ id: y.id, key: y.key, title: y.title, status: y.status }],
      blocks: [],
    });
    expect(await service.list(projectId, y.id)).toEqual({
      dependsOn: [],
      blocks: [{ id: x.id, key: x.key, title: x.title, status: x.status }],
    });
    await service.remove(projectId, x.id, y.id);
    expect(await service.list(projectId, y.id)).toEqual({
      dependsOn: [],
      blocks: [],
    });
    await service.add(projectId, x.id, y.id);
    await database.getRepository(Ticket).delete(y.id);
    expect(await service.list(projectId, x.id)).toEqual({
      dependsOn: [],
      blocks: [],
    });
  });

  it('rejects self links, foreign tickets and indirect cycles', async () => {
    await expect(service.add(projectId, x.id, x.id)).rejects.toThrow(
      'depender de sí mismo'
    );
    await expect(service.add(projectId, x.id, foreign.id)).rejects.toThrow(
      'no pertenece a este proyecto'
    );
    await expect(service.list(otherProjectId, x.id)).rejects.toThrow(
      'no existe en este proyecto'
    );
    await service.add(projectId, x.id, y.id);
    await service.add(projectId, y.id, z.id);
    await expect(service.add(projectId, z.id, x.id)).rejects.toThrow(
      'dependencia circular'
    );
  });

  it('serializes concurrent inverse links so only one edge is stored', async () => {
    const results = await Promise.allSettled([
      service.add(projectId, x.id, y.id),
      service.add(projectId, y.id, x.id),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled')
    ).toHaveLength(1);
    expect(
      results.find((result) => result.status === 'rejected')
    ).toMatchObject({
      reason: expect.objectContaining({
        message: expect.stringContaining('dependencia circular'),
      }),
    });
  });
});
