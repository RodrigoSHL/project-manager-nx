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
    private readonly works: Repository<WorkEntity>
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
