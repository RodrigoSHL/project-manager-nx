import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { AssetEntity } from '../catalog/entities/asset.entity';
import { SiteEntity } from '../catalog/entities/site.entity';
import { TenantEntity } from '../catalog/entities/tenant.entity';
import { WorkEntity } from '../works/entities/work.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantMembershipEntity } from './entities/tenant-membership.entity';

@Injectable()
export class PlatformService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
    @InjectRepository(SiteEntity)
    private readonly sites: Repository<SiteEntity>,
    @InjectRepository(AssetEntity)
    private readonly assets: Repository<AssetEntity>,
    @InjectRepository(WorkEntity)
    private readonly works: Repository<WorkEntity>,
    @InjectRepository(TenantMembershipEntity)
    private readonly memberships: Repository<TenantMembershipEntity>
  ) {}

  async listTenants() {
    const tenants = await this.tenants.find({
      order: { active: 'DESC', name: 'ASC' },
    });
    return Promise.all(tenants.map((tenant) => this.withUsage(tenant)));
  }

  async getTenant(tenantId: string) {
    return this.withUsage(await this.findTenantOrFail(tenantId));
  }

  async createTenant(dto: CreateTenantDto) {
    const tenant = this.tenants.create({
      code: this.normalizeCode(dto.code),
      name: dto.name.trim(),
      active: dto.active ?? true,
    });
    return this.withUsage(await this.saveTenant(tenant));
  }

  async updateTenant(tenantId: string, dto: UpdateTenantDto) {
    const tenant = await this.findTenantOrFail(tenantId);
    Object.assign(tenant, {
      code: dto.code === undefined ? tenant.code : this.normalizeCode(dto.code),
      name: dto.name === undefined ? tenant.name : dto.name.trim(),
      active: dto.active ?? tenant.active,
    });
    return this.withUsage(await this.saveTenant(tenant));
  }

  async listAccessibleTenants(userId: string) {
    const memberships = await this.memberships.find({
      where: { userId, active: true, tenant: { active: true } },
      relations: { tenant: true },
      order: { tenant: { name: 'ASC' } },
    });
    return memberships.map(({ tenant }) => tenant);
  }

  async hasTenantAccess(userId: string, tenantId: string) {
    return this.memberships.exists({
      where: {
        userId,
        tenantId,
        active: true,
        tenant: { active: true },
      },
    });
  }

  async listTenantMemberships(tenantId: string) {
    await this.findTenantOrFail(tenantId);
    return this.memberships.find({
      where: { tenantId, active: true },
      order: { createdAt: 'ASC' },
    });
  }

  async grantTenantAccess(tenantId: string, userId: string) {
    await this.findTenantOrFail(tenantId);
    const current = await this.memberships.findOne({
      where: { tenantId, userId },
    });
    const membership = current
      ? Object.assign(current, { active: true })
      : this.memberships.create({ tenantId, userId, active: true });
    return this.memberships.save(membership);
  }

  async revokeTenantAccess(tenantId: string, userId: string) {
    await this.findTenantOrFail(tenantId);
    await this.memberships.delete({ tenantId, userId });
    return { tenantId, userId, revoked: true };
  }

  private async withUsage(tenant: TenantEntity) {
    const [siteCount, assetCount, workCount] = await Promise.all([
      this.sites.count({ where: { tenantId: tenant.id } }),
      this.assets.count({ where: { tenantId: tenant.id } }),
      this.works.count({ where: { tenantId: tenant.id } }),
    ]);
    return { ...tenant, siteCount, assetCount, workCount };
  }

  private async findTenantOrFail(tenantId: string) {
    const tenant = await this.tenants.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  private async saveTenant(tenant: TenantEntity) {
    try {
      return await this.tenants.save(tenant);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      ) {
        throw new ConflictException('A tenant with this code already exists');
      }
      throw error;
    }
  }

  private normalizeCode(code: string) {
    return code.trim().toUpperCase();
  }
}
