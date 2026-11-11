import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTicketDependencies1794358800000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "ticket_dependencies" (
      "ticketId" uuid NOT NULL,
      "prerequisiteId" uuid NOT NULL,
      CONSTRAINT "PK_ticket_dependencies" PRIMARY KEY ("ticketId", "prerequisiteId"),
      CONSTRAINT "CHK_ticket_dependencies_distinct" CHECK ("ticketId" <> "prerequisiteId"),
      CONSTRAINT "FK_ticket_dependencies_ticket" FOREIGN KEY ("ticketId") REFERENCES "tickets" ("id") ON DELETE CASCADE,
      CONSTRAINT "FK_ticket_dependencies_prerequisite" FOREIGN KEY ("prerequisiteId") REFERENCES "tickets" ("id") ON DELETE CASCADE
    )`);
    await queryRunner.query(
      'CREATE INDEX "IDX_ticket_dependencies_prerequisite" ON "ticket_dependencies" ("prerequisiteId")'
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "ticket_dependencies"');
  }
}
