import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { AddCommentAttachments1793404800000 } from '../../migrations/1793404800000-AddCommentAttachments';

const databaseUrl = process.env.COMMENT_ATTACHMENTS_TEST_DATABASE_URL;
const postgresTests = databaseUrl ? describe : describe.skip;

postgresTests('Comment attachment migration (real PostgreSQL)', () => {
  const schema = `comment_files_${randomUUID().replace(/-/g, '')}`;
  const existingId = randomUUID();
  let database: DataSource;
  const migration = new AddCommentAttachments1793404800000();
  beforeAll(async () => {
    const url = new URL(databaseUrl);
    if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.pathname !== '/comment_attachments_validation') {
      throw new Error('Tests require a disposable local comment_attachments_validation database');
    }
    database = new DataSource({ type: 'postgres', url: databaseUrl, extra: { options: `-c search_path=${schema},public` } });
    await database.initialize();
    await database.query(`CREATE SCHEMA "${schema}"`);
    await database.query('CREATE TABLE "comments" (id uuid PRIMARY KEY, body text NOT NULL)');
    await database.query('INSERT INTO "comments" (id, body) VALUES ($1, $2)', [existingId, 'Comentario anterior']);
  });
  afterAll(async () => {
    if (database?.isInitialized) {
      await database.query(`DROP SCHEMA "${schema}" CASCADE`);
      await database.destroy();
    }
  });

  it('preserves existing comments and stores real file references across reloads', async () => {
    const runner = database.createQueryRunner();
    try {
      await migration.up(runner);
      expect(await database.query('SELECT body, "attachmentIds" FROM "comments" WHERE id = $1', [existingId])).toEqual([{ body: 'Comentario anterior', attachmentIds: [] }]);
      const attachmentIds = [randomUUID(), randomUUID()];
      const id = randomUUID();
      await database.query('INSERT INTO "comments" (id, body, "attachmentIds") VALUES ($1, $2, $3)', [id, '', attachmentIds]);
      expect(await database.query('SELECT body, "attachmentIds" FROM "comments" WHERE id = $1', [id])).toEqual([{ body: '', attachmentIds }]);
      await migration.down(runner);
      expect(await database.query('SELECT body FROM "comments" WHERE id = $1', [existingId])).toEqual([{ body: 'Comentario anterior' }]);
    } finally { await runner.release(); }
  });
});
