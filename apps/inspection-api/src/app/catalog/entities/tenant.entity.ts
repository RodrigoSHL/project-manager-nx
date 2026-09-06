import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tenants')
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 160 })
  name!: string;
}
