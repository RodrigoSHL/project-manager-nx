import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetEntity } from './entities/asset.entity';
import { SiteEntity } from './entities/site.entity';
import { TenantEntity } from './entities/tenant.entity';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
    @InjectRepository(SiteEntity)
    private readonly sites: Repository<SiteEntity>,
    @InjectRepository(AssetEntity)
    private readonly assets: Repository<AssetEntity>
  ) {}

  listTenants() {
    return this.tenants.find({ order: { name: 'ASC' } });
  }

  async listSites(tenantId: string) {
    await this.assertTenantExists(tenantId);
    return this.sites.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async listAssets(tenantId: string, siteId: string) {
    await this.assertSiteBelongsToTenant(tenantId, siteId);
    return this.assets.find({
      where: { tenantId, siteId },
      order: { code: 'ASC' },
    });
  }

  async getAsset(tenantId: string, siteId: string, assetId: string) {
    await this.assertSiteBelongsToTenant(tenantId, siteId);
    const asset = await this.assets.findOne({
      where: { id: assetId, tenantId, siteId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found in this tenant and site');
    }

    return asset;
  }

  private async assertTenantExists(tenantId: string) {
    if (!(await this.tenants.exist({ where: { id: tenantId } }))) {
      throw new NotFoundException('Tenant not found');
    }
  }

  private async assertSiteBelongsToTenant(tenantId: string, siteId: string) {
    const exists = await this.sites.exist({ where: { id: siteId, tenantId } });
    if (!exists) {
      throw new NotFoundException('Site not found in this tenant');
    }
  }
}
