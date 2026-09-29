import { DataSource, type DataSourceOptions } from 'typeorm';
import { FindingEntity } from '../works/entities/finding.entity';
import { getDatabaseConfig } from './database.config';

describe('Inspection database metadata', () => {
  it('builds PostgreSQL metadata for all registered entities without connecting', async () => {
    const dataSource = new DataSource(getDatabaseConfig() as DataSourceOptions);
    await (
      dataSource as unknown as { buildMetadatas(): Promise<void> }
    ).buildMetadatas();
    const metadata = dataSource.getMetadata(FindingEntity);
    expect(
      metadata.findColumnWithPropertyName('conceptNameSnapshot')?.type
    ).toBe('varchar');
    expect(metadata.findColumnWithPropertyName('unitSnapshot')?.type).toBe(
      'varchar'
    );
  });
});
