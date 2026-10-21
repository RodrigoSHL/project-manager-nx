import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { WorkspaceMember } from '../workspace-members/entities/workspace-member.entity';
import { InitialUserSchema1792540800000 } from './1792540800000-InitialUserSchema';

// Only run against an explicitly supplied disposable PostgreSQL test instance.
const integration = process.env.USER_MIGRATION_TEST_URL
  ? describe
  : describe.skip;
integration('User schema baseline on PostgreSQL', () => {
  let db: DataSource;
  let schema: string;
  const createConnection = (synchronize = false) =>
    new DataSource({
      type: 'postgres',
      url: process.env.USER_MIGRATION_TEST_URL,
      schema,
      synchronize,
      entities: [User, Workspace, WorkspaceMember],
      migrations: [InitialUserSchema1792540800000],
      logging: false,
    });
  beforeEach(async () => {
    schema = `mf_audit_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    db = createConnection();
    await db.initialize();
    await db.query(`CREATE SCHEMA "${schema}"`);
  });
  afterEach(async () => {
    if (db?.isInitialized) {
      await db.query(`DROP SCHEMA "${schema}" CASCADE`);
      await db.destroy();
    }
  });

  it('creates a new database schema with defaults, uniqueness and cascading membership', async () => {
    await db.runMigrations();
    const user = await db
      .getRepository(User)
      .save({ email: 'fresh@example.invalid', name: 'Fresh' });
    const workspace = await db
      .getRepository(Workspace)
      .save({ name: 'Test', slug: 'fresh' });
    await db
      .getRepository(WorkspaceMember)
      .save({ userId: user.id, workspaceId: workspace.id });
    expect(user.roles).toEqual(['user']);
    await expect(
      db.getRepository(User).save({ email: user.email, name: 'Duplicate' })
    ).rejects.toThrow();
    await db.getRepository(User).delete(user.id);
    expect(await db.getRepository(WorkspaceMember).count()).toBe(0);
    expect(await db.runMigrations()).toHaveLength(0);
  });

  it('adopts the old synchronized schema without changing rows or requesting schema changes', async () => {
    await db.destroy();
    db = createConnection(true);
    await db.initialize();
    const user = await db
      .getRepository(User)
      .save({
        email: 'existing@example.invalid',
        name: 'Existing',
        passwordHash: 'retained-test-hash',
      });
    const workspace = await db
      .getRepository(Workspace)
      .save({ name: 'Existing', slug: 'existing' });
    await db
      .getRepository(WorkspaceMember)
      .save({ userId: user.id, workspaceId: workspace.id });
    const before = await db.query(`SELECT * FROM "${schema}"."users"`);
    await db.destroy();
    db = createConnection(false);
    await db.initialize();
    await db.runMigrations();
    expect(await db.query(`SELECT * FROM "${schema}"."users"`)).toEqual(before);
    expect(await db.getRepository(WorkspaceMember).count()).toBe(1);
    expect(
      (await db.driver.createSchemaBuilder().log()).upQueries
    ).toHaveLength(0);
  });

  it('stops rather than silently adopting an incomplete existing table', async () => {
    await db.query(`CREATE TABLE "${schema}"."users" (id uuid PRIMARY KEY)`);
    await expect(db.runMigrations()).rejects.toThrow('missing columns');
    expect(await db.query(`SELECT * FROM "${schema}"."users"`)).toEqual([]);
  });
});
