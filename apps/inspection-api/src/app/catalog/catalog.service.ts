import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { AssetEntity } from './entities/asset.entity';
import { SiteEntity } from './entities/site.entity';
import { TenantEntity } from './entities/tenant.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

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
    return this.findAssetOrFail(tenantId, siteId, assetId);
  }

  async createAsset(tenantId: string, siteId: string, dto: CreateAssetDto) {
    await this.assertSiteBelongsToTenant(tenantId, siteId);
    await this.assertParentIsInContext(tenantId, siteId, dto.parentId ?? null);
    this.assertRootAssetType(dto.parentId ?? null, dto.type);

    const asset = this.assets.create({
      tenantId,
      siteId,
      code: dto.code.trim(),
      name: dto.name.trim(),
      type: dto.type.trim(),
      parentId: dto.parentId ?? null,
      status: dto.status,
      description: dto.description?.trim() || null,
    });

    return this.saveAsset(asset);
  }

  async updateAsset(
    tenantId: string,
    siteId: string,
    assetId: string,
    dto: UpdateAssetDto
  ) {
    await this.assertSiteBelongsToTenant(tenantId, siteId);
    const asset = await this.findAssetOrFail(tenantId, siteId, assetId);
    const nextParentId =
      dto.parentId === undefined ? asset.parentId : dto.parentId;
    const nextType = dto.type === undefined ? asset.type : dto.type.trim();

    if (nextParentId === assetId) {
      throw new BadRequestException('An asset cannot be its own parent');
    }

    await this.assertParentIsInContext(
      tenantId,
      siteId,
      nextParentId ?? null,
      assetId
    );
    this.assertRootAssetType(nextParentId ?? null, nextType);

    Object.assign(asset, {
      code: dto.code === undefined ? asset.code : dto.code.trim(),
      name: dto.name === undefined ? asset.name : dto.name.trim(),
      type: nextType,
      parentId: nextParentId ?? null,
      status: dto.status ?? asset.status,
      description:
        dto.description === undefined
          ? asset.description
          : dto.description?.trim() || null,
    });

    return this.saveAsset(asset);
  }

  async deleteAsset(tenantId: string, siteId: string, assetId: string) {
    await this.assertSiteBelongsToTenant(tenantId, siteId);
    const asset = await this.findAssetOrFail(tenantId, siteId, assetId);
    const child = await this.assets.findOne({
      where: { tenantId, siteId, parentId: assetId },
      select: { id: true },
    });

    if (child) {
      throw new ConflictException(
        'Cannot delete an asset that still has child assets'
      );
    }

    await this.assets.remove(asset);
    return { id: assetId, deleted: true };
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

  private async findAssetOrFail(
    tenantId: string,
    siteId: string,
    assetId: string
  ) {
    const asset = await this.assets.findOne({
      where: { id: assetId, tenantId, siteId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found in this tenant and site');
    }

    return asset;
  }

  private async assertParentIsInContext(
    tenantId: string,
    siteId: string,
    parentId: string | null,
    childAssetId?: string
  ) {
    if (!parentId) return;

    const visited = new Set<string>();
    let currentId: string | null = parentId;

    while (currentId) {
      if (currentId === childAssetId || visited.has(currentId)) {
        throw new BadRequestException(
          'An asset hierarchy cannot contain cycles'
        );
      }
      visited.add(currentId);

      const parent = await this.assets.findOne({
        where: { id: currentId, tenantId, siteId },
        select: { id: true, parentId: true },
      });

      if (!parent) {
        throw new BadRequestException(
          'The parent asset must belong to the selected tenant and site'
        );
      }

      currentId = parent.parentId;
    }
  }

  private assertRootAssetType(parentId: string | null, type: string) {
    if (!parentId && type.trim() !== 'SUBSTATION') {
      throw new BadRequestException('Root assets must use the SUBSTATION type');
    }
  }

  private async saveAsset(asset: AssetEntity) {
    try {
      return await this.assets.save(asset);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'Another asset with this code already exists in the selected site'
        );
      }

      throw error;
    }
  }

  private isUniqueViolation(error: unknown) {
    return (
      error instanceof QueryFailedError &&
      (error.driverError as { code?: string })?.code === '23505'
    );
  }
}
