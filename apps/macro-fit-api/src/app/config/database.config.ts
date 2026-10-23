import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { nutritionEntities } from '../nutrition/entities/nutrition.entity';
import { CreateNutritionRecords1792713600000 } from '../../migrations/1792713600000-CreateNutritionRecords';

export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host:
    process.env.MACROFIT_DB_HOST || process.env.DATABASE_HOST || 'localhost',
  port: Number(
    process.env.MACROFIT_DB_PORT || process.env.DATABASE_PORT || 5432
  ),
  username:
    process.env.MACROFIT_DB_USERNAME ||
    process.env.DATABASE_USERNAME ||
    'postgres',
  password:
    process.env.MACROFIT_DB_PASSWORD ||
    process.env.DATABASE_PASSWORD ||
    'postgres',
  database: process.env.MACROFIT_DB_NAME || 'macrofit_db',
  entities: nutritionEntities,
  migrations: [CreateNutritionRecords1792713600000],
  migrationsRun: process.env.MACROFIT_MIGRATIONS_RUN === 'true',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
