import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStorySubtaskTickets1793491200000 implements MigrationInterface {
  name = 'AddStorySubtaskTickets1793491200000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "tickets" ADD "parentTicketId" uuid');
    await queryRunner.query('CREATE INDEX "IDX_tickets_parentTicketId" ON "tickets" ("parentTicketId")');
    await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "FK_tickets_parentTicketId"
      FOREIGN KEY ("parentTicketId") REFERENCES "tickets" ("id") ON DELETE RESTRICT`);
    // Keep legacy standalone subtasks; all new associations are validated by the API.
    await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "CHK_tickets_subtask_parent"
      CHECK ("parentTicketId" IS NULL OR ("type" = 'subtask' AND "parentTicketId" <> "id"))`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "tickets" DROP CONSTRAINT "CHK_tickets_subtask_parent"');
    await queryRunner.query('ALTER TABLE "tickets" DROP CONSTRAINT "FK_tickets_parentTicketId"');
    await queryRunner.query('DROP INDEX "IDX_tickets_parentTicketId"');
    await queryRunner.query('ALTER TABLE "tickets" DROP COLUMN "parentTicketId"');
  }
}
