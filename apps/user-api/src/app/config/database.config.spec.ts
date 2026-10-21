import { getDatabaseConfig } from './database.config';

describe('User database configuration', () => {
  const environment = { ...process.env };
  afterEach(() => {
    process.env = { ...environment };
  });
  it('reads environment settings when its factory runs', () => {
    process.env.USER_DATABASE_NAME = 'test_database_after_import';
    expect(getDatabaseConfig().database).toBe('test_database_after_import');
  });
  it('never synchronizes a production schema even with a stale true setting', () => {
    process.env.NODE_ENV = 'production';
    process.env.TYPEORM_SYNCHRONIZE = 'true';
    process.env.USER_MIGRATIONS_RUN = 'true';
    expect(getDatabaseConfig()).toMatchObject({
      synchronize: false,
      migrationsRun: true,
    });
  });
});
