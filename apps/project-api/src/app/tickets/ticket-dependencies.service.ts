import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { TicketDependency } from './entities/ticket-dependency.entity';
import { Ticket } from './entities/ticket.entity';

const ticketSummary = {
  id: true,
  key: true,
  title: true,
  status: true,
} as const;

@Injectable()
export class TicketDependenciesService {
  constructor(private readonly dataSource: DataSource) {}

  async list(
    projectId: string,
    ticketId: string,
    manager = this.dataSource.manager
  ) {
    await this.assertTicketExists(manager, projectId, ticketId);
    const inProject = { ticket: { projectId }, prerequisite: { projectId } };
    const links = await manager.getRepository(TicketDependency).find({
      where: [
        { ...inProject, ticketId },
        { ...inProject, prerequisiteId: ticketId },
      ],
      relations: { ticket: true, prerequisite: true },
      select: {
        ticketId: true,
        prerequisiteId: true,
        ticket: ticketSummary,
        prerequisite: ticketSummary,
      },
      order: { ticketId: 'ASC', prerequisiteId: 'ASC' },
    });
    return {
      dependsOn: links
        .filter((link) => link.ticketId === ticketId)
        .map((link) => link.prerequisite),
      blocks: links
        .filter((link) => link.prerequisiteId === ticketId)
        .map((link) => link.ticket),
    };
  }

  async add(projectId: string, ticketId: string, prerequisiteId: string) {
    if (ticketId === prerequisiteId) {
      throw new BadRequestException('Un ticket no puede depender de sí mismo.');
    }

    return this.dataSource.transaction(async (manager) => {
      await this.lockProject(manager, projectId);
      await this.assertTicketExists(manager, projectId, ticketId);
      if (
        !(await manager
          .getRepository(Ticket)
          .existsBy({ id: prerequisiteId, projectId }))
      ) {
        throw new BadRequestException(
          'El ticket seleccionado no pertenece a este proyecto.'
        );
      }

      const [result] = await manager.query(
        `WITH RECURSIVE prerequisites(id) AS (
          SELECT "prerequisiteId" FROM "ticket_dependencies" WHERE "ticketId" = $1
          UNION
          SELECT link."prerequisiteId"
          FROM "ticket_dependencies" link JOIN prerequisites step ON step.id = link."ticketId"
        )
        SELECT EXISTS (SELECT 1 FROM prerequisites WHERE id = $2) AS cycle`,
        [prerequisiteId, ticketId]
      );
      if (result.cycle) {
        throw new BadRequestException(
          'Esta relación crearía una dependencia circular.'
        );
      }

      await manager
        .getRepository(TicketDependency)
        .createQueryBuilder()
        .insert()
        .values({ ticketId, prerequisiteId })
        .orIgnore()
        .execute();
      return this.list(projectId, ticketId, manager);
    });
  }

  async remove(projectId: string, ticketId: string, prerequisiteId: string) {
    await this.dataSource.transaction(async (manager) => {
      await this.lockProject(manager, projectId);
      await this.assertTicketExists(manager, projectId, ticketId);
      await manager
        .getRepository(TicketDependency)
        .delete({ ticketId, prerequisiteId });
    });
  }

  private async assertTicketExists(
    manager: EntityManager,
    projectId: string,
    id: string
  ) {
    if (!(await manager.getRepository(Ticket).existsBy({ id, projectId }))) {
      throw new NotFoundException('El ticket no existe en este proyecto.');
    }
  }

  private async lockProject(manager: EntityManager, projectId: string) {
    // Serialize graph edits with each other and with ticket deletions in this project.
    await manager.query(
      'SELECT "id" FROM "projects" WHERE "id" = $1 FOR UPDATE',
      [projectId]
    );
  }
}
