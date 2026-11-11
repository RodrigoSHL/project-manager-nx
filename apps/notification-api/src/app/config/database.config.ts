import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Notification } from '../notifications/entities/notification.entity';
import { CreateNotifications1794268800000 } from '../../migrations/1794268800000-CreateNotifications';

export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host:
    process.env.NOTIFICATION_DB_HOST ||
    process.env.DATABASE_HOST ||
    'localhost',
  port: Number(
    process.env.NOTIFICATION_DB_PORT || process.env.DATABASE_PORT || 5432
  ),
  username:
    process.env.NOTIFICATION_DB_USERNAME ||
    process.env.DATABASE_USERNAME ||
    'postgres',
  password:
    process.env.NOTIFICATION_DB_PASSWORD ||
    process.env.DATABASE_PASSWORD ||
    'postgres',
  database: process.env.NOTIFICATION_DB_NAME || 'notification_db',
  entities: [Notification],
  migrations: [CreateNotifications1794268800000],
  migrationsRun: process.env.NOTIFICATION_MIGRATIONS_RUN !== 'false',
  synchronize: false,
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
