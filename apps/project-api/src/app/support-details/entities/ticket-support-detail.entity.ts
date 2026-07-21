import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';

@Entity('ticket_support_details')
export class TicketSupportDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  ticketId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  clientContact: string;

  /** Valor cobrado expresado en UF */
  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  ufValue: number;

  @Column({ type: 'boolean', default: true })
  isBillable: boolean;

  @Column({ type: 'date', nullable: true })
  billedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  invoiceRef: string;

  @Column({ type: 'timestamp', nullable: true })
  slaDeadline: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Ticket, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;
}
