import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Repository } from 'typeorm';
import { TenantEntity } from '../entities/tenant.entity';

@Injectable()
export class ActiveTenantGuard implements CanActivate {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      params?: { tenantId?: string };
    }>();
    const tenantId = request.params?.tenantId;
    if (!tenantId || !isUUID(tenantId)) return true;

    const active = await this.tenants.exist({
      where: { id: tenantId, active: true },
    });
    if (!active) throw new NotFoundException('Tenant not found');
    return true;
  }
}
