import {
  Check,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Ticket } from './ticket.entity';

@Entity('ticket_dependencies')
@Check('CHK_ticket_dependencies_distinct', '"ticketId" <> "prerequisiteId"')
export class TicketDependency {
  @PrimaryColumn({
    type: 'uuid',
    primaryKeyConstraintName: 'PK_ticket_dependencies',
  })
  ticketId: string;

  @PrimaryColumn({
    type: 'uuid',
    primaryKeyConstraintName: 'PK_ticket_dependencies',
  })
  @Index('IDX_ticket_dependencies_prerequisite')
  prerequisiteId: string;

  @ManyToOne(() => Ticket, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'ticketId',
    foreignKeyConstraintName: 'FK_ticket_dependencies_ticket',
  })
  ticket: Ticket;

  @ManyToOne(() => Ticket, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'prerequisiteId',
    foreignKeyConstraintName: 'FK_ticket_dependencies_prerequisite',
  })
  prerequisite: Ticket;
}
