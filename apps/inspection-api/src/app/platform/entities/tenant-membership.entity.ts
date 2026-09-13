import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantEntity } from '../../catalog/entities/tenant.entity';

export enum TenantRole {
  TENANT_ADMIN = 'TENANT_ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  INSPECTOR = 'INSPECTOR',
  VIEWER = 'VIEWER',
}

@Entity('tenant_memberships')
@Index('UQ_tenant_memberships_tenant_user', ['tenantId', 'userId'], {
  unique: true,
})
export class TenantMembershipEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: TenantRole,
    enumName: 'tenant_role_enum',
    default: TenantRole.INSPECTOR,
  })
  role!: TenantRole;

  @Column({ default: true })
  active!: boolean;

  @ManyToOne(() => TenantEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: TenantEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
