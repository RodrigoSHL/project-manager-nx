import { MigrationInterface, QueryRunner, Table } from 'typeorm';

/** Baseline for databases previously maintained with synchronize=true. */
export class InitialUserSchema1792540800000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    const id = {
      name: 'id',
      type: 'uuid',
      isPrimary: true,
      default: 'uuid_generate_v4()',
    };
    const timestamps = [
      { name: 'createdAt', type: 'timestamp', default: 'now()' },
      { name: 'updatedAt', type: 'timestamp', default: 'now()' },
    ];
    const tables = [
      new Table({
        name: 'users',
        columns: [
          id,
          { name: 'email', type: 'varchar', length: '255', isUnique: true },
          { name: 'name', type: 'varchar', length: '255' },
          {
            name: 'passwordHash',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'roles',
            type: 'text',
            isArray: true,
            default: "'{user}'::text[]",
          },
          { name: 'avatarUrl', type: 'text', isNullable: true },
          ...timestamps,
        ],
      }),
      new Table({
        name: 'workspaces',
        columns: [
          id,
          { name: 'name', type: 'varchar', length: '255' },
          { name: 'slug', type: 'varchar', length: '100', isUnique: true },
          { name: 'description', type: 'text', isNullable: true },
          ...timestamps,
        ],
      }),
      new Table({
        name: 'workspace_members',
        columns: [
          id,
          { name: 'workspaceId', type: 'uuid' },
          { name: 'userId', type: 'uuid' },
          {
            name: 'role',
            type: 'enum',
            enum: ['owner', 'admin', 'member', 'viewer'],
            enumName: 'workspace_members_role_enum',
            default: "'member'",
          },
          { name: 'joinedAt', type: 'timestamp', default: 'now()' },
        ],
        uniques: [{ columnNames: ['workspaceId', 'userId'] }],
        indices: [
          { columnNames: ['workspaceId'] },
          { columnNames: ['userId'] },
        ],
        foreignKeys: [
          {
            columnNames: ['workspaceId'],
            referencedTableName: 'workspaces',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    ];
    for (const expected of tables) {
      const existing = await queryRunner.getTable(expected.name);
      if (!existing) {
        await queryRunner.createTable(expected);
        continue;
      }
      // Adopt an existing synchronized schema without altering tables or user data.
      const missing = expected.columns.filter(
        (column) => !existing.findColumnByName(column.name)
      );
      if (missing.length) {
        throw new Error(
          `Cannot baseline ${expected.name}: missing columns ${missing
            .map((column) => column.name)
            .join(', ')}`
        );
      }
    }
  }

  async down(): Promise<void> {
    throw new Error(
      'The user schema baseline cannot be dropped automatically. Restore a verified backup if necessary.'
    );
  }
}
