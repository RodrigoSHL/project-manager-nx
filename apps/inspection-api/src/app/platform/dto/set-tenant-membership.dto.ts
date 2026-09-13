import { IsEnum, IsOptional } from 'class-validator';
import { TenantRole } from '../entities/tenant-membership.entity';

export class SetTenantMembershipDto {
  @IsOptional()
  @IsEnum(TenantRole)
  role?: TenantRole;
}
