import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { InitialUserSchema1792540800000 } from '../../migrations/1792540800000-InitialUserSchema';

export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.USER_DATABASE_NAME || 'user_management_db',
  entities: [],
  migrations: [InitialUserSchema1792540800000],
  migrationsRun: process.env.USER_MIGRATIONS_RUN === 'true',
  synchronize:
    process.env.NODE_ENV !== 'production' &&
    process.env.TYPEORM_SYNCHRONIZE !== 'false',
  logging: process.env.NODE_ENV === 'development',
});
