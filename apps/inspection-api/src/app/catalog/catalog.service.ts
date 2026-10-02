import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { AssetEntity } from './entities/asset.entity';
import { AssetTypeEntity } from './entities/asset-type.entity';
import { AssetTypeWorkTypeEntity } from './entities/asset-type-work-type.entity';
import { AssetWorkTypeEntity } from './entities/asset-work-type.entity';
import { SiteEntity } from './entities/site.entity';
import { TenantEntity } from './entities/tenant.entity';
import { WorkTypeEntity } from './entities/work-type.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';
import { CreateConceptDto, ConceptOptionDto } from './dto/create-concept.dto';
import { UpdateConceptDto } from './dto/update-concept.dto';
import { AssetTypeConceptEntity } from './entities/asset-type-concept.entity';
import { ConceptEntity, ConceptType } from './entities/concept.entity';
import { ConceptOptionEntity } from './entities/concept-option.entity';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { getAssetDescendants as collectAssetDescendants } from './asset-descendants';
import { SeverityLevelEntity } from './entities/severity-level.entity';
import {
  ReportCoverDefaults,
  TenantReportSettingsEntity,
} from './entities/tenant-report-settings.entity';
import {
  CreateSeverityLevelDto,
  UpdateSeverityLevelDto,
} from './dto/severity-level.dto';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenants: Repository<TenantEntity>,
    @InjectRepository(SiteEntity)
    private readonly sites: Repository<SiteEntity>,
    @InjectRepository(AssetEntity)
    private readonly assets: Repository<AssetEntity>,
    @InjectRepository(AssetTypeEntity)
    private readonly assetTypes: Repository<AssetTypeEntity>,
    @InjectRepository(WorkTypeEntity)
    private readonly workTypes: Repository<WorkTypeEntity>,
    @InjectRepository(AssetTypeWorkTypeEntity)
    private readonly assetTypeWorkTypes: Repository<AssetTypeWorkTypeEntity>,
    @InjectRepository(AssetWorkTypeEntity)
    private readonly assetWorkTypes: Repository<AssetWorkTypeEntity>,
    @InjectRepository(ConceptEntity)
    private readonly concepts: Repository<ConceptEntity>,
    @InjectRepository(ConceptOptionEntity)
    private readonly conceptOptions: Repository<ConceptOptionEntity>,
    @InjectRepository(AssetTypeConceptEntity)
    private readonly assetTypeConcepts: Repository<AssetTypeConceptEntity>,
    @InjectRepository(SeverityLevelEntity)
    private readonly severityLevels: Repository<SeverityLevelEntity>,
    @InjectRepository(TenantReportSettingsEntity)
    private readonly reportSettings: Repository<TenantReportSettingsEntity>,
    private readonly dataSource: DataSource
  ) {}

  async getReportSettings(tenantId: string) {
    await this.assertTenantExists(tenantId);
    const settings = await this.reportSettings.findOne({ where: { tenantId } });
    return {
      tenantId,
      defaults: settings?.defaults ?? {},
      logoUrl: settings?.logoDataUri ?? null,
    };
  }

  async saveReportDefaults(tenantId: string, defaults?: ReportCoverDefaults) {
    await this.assertTenantExists(tenantId);
    if (!defaults || typeof defaults !== 'object' || Array.isArray(defaults))
      throw new BadRequestException('Invalid report defaults');
    const fields = [
      'content',
      'requestedBy',
      'preparedBy',
      'distribution',
      'receivedBy',
      'introduction',
    ] as const;
    const normalized: ReportCoverDefaults = {};
    for (const field of fields) {
      const value = defaults[field];
      if (value === undefined || value === null) continue;
      if (typeof value !== 'string' || value.length > 4000)
        throw new BadRequestException(`Invalid report field: ${field}`);
      normalized[field] = value.trim() || null;
    }
    const settings =
      (await this.reportSettings.findOne({ where: { tenantId } })) ??
      this.reportSettings.create({ tenantId, defaults: {}, logoDataUri: null });
    settings.defaults = normalized;
    await this.reportSettings.save(settings);
    return this.getReportSettings(tenantId);
  }

  async saveReportLogo(tenantId: string, logoUrl?: string | null) {
    await this.assertTenantExists(tenantId);
    if (
      logoUrl === undefined ||
      (logoUrl !== null &&
        (!/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(logoUrl) ||
          logoUrl.length > 90000))
    ) {
      throw new BadRequestException('Invalid report logo');
    }
    const settings =
      (await this.reportSettings.findOne({ where: { tenantId } })) ??
      this.reportSettings.create({ tenantId, defaults: {}, logoDataUri: null });
    settings.logoDataUri = logoUrl;
    await this.reportSettings.save(settings);
    return this.getReportSettings(tenantId);
  }

  listTenants() {
    return this.tenants.find({
      where: { active: true },
      order: { name: 'ASC' },
    });
  }

  async listSeverityLevels(tenantId: string) {
    await this.assertTenantExists(tenantId);
    return this.severityLevels.find({
      where: { tenantId },
      order: { order: 'ASC', name: 'ASC' },
    });
  }

  async createSeverityLevel(tenantId: string, dto: CreateSeverityLevelDto) {
    await this.assertTenantExists(tenantId);
    try {
      return await this.severityLevels.save(
        this.severityLevels.create({
          tenantId,
          code: this.normalizeCatalogCode(dto.code),
          name: dto.name.trim(),
          order: dto.order,
          active: dto.active ?? true,
        })
      );
    } catch (error) {
      if (this.isUniqueViolation(error))
        throw new ConflictException(
          'Severity code already exists in this tenant'
        );
      throw error;
    }
  }

  async updateSeverityLevel(
    tenantId: string,
    severityId: string,
    dto: UpdateSeverityLevelDto
  ) {
    await this.assertTenantExists(tenantId);
    const level = await this.severityLevels.findOne({
      where: { id: severityId, tenantId },
    });
    if (!level)
      throw new NotFoundException('Severity level not found in this tenant');
    if (dto.code !== undefined)
      level.code = this.normalizeCatalogCode(dto.code);
    if (dto.name !== undefined) level.name = dto.name.trim();
    if (dto.order !== undefined) level.order = dto.order;
    if (dto.active !== undefined) level.active = dto.active;
    try {
      return await this.severityLevels.save(level);
    } catch (error) {
      if (this.isUniqueViolation(error))
        throw new ConflictException(
          'Severity code already exists in this tenant'
        );
      throw error;
    }
  }

  async listSites(tenantId: string) {
    await this.assertTenantExists(tenantId);
    return this.sites.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async createSite(tenantId: string, dto: CreateSiteDto) {
    await this.assertTenantExists(tenantId);
    const site = this.sites.create({
      tenantId,
      code: this.normalizeCatalogCode(dto.code),
      name: dto.name.trim(),
      type: dto.type,
      active: dto.active ?? true,
    });

    return this.saveSite(site);
  }

  async updateSite(tenantId: string, siteId: string, dto: UpdateSiteDto) {
    await this.assertTenantExists(tenantId);
    const site = await this.findSiteOrFail(tenantId, siteId);

    Object.assign(site, {
      code:
        dto.code === undefined
          ? site.code
          : this.normalizeCatalogCode(dto.code),
      name: dto.name === undefined ? site.name : dto.name.trim(),
      type: dto.type ?? site.type,
      active: dto.active ?? site.active,
    });

    return this.saveSite(site);
  }

  async listAssetTypes(tenantId: string) {
    await this.assertTenantExists(tenantId);
    return this.assetTypes.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async createAssetType(tenantId: string, dto: CreateCatalogItemDto) {
    await this.assertTenantExists(tenantId);
    const assetType = this.assetTypes.create({
      tenantId,
      code: this.normalizeCatalogCode(dto.code),
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      active: dto.active ?? true,
    });

    return this.saveAssetType(assetType);
  }

  async updateAssetType(
    tenantId: string,
    assetTypeId: string,
    dto: UpdateCatalogItemDto
  ) {
    await this.assertTenantExists(tenantId);
    const assetType = await this.findAssetTypeOrFail(tenantId, assetTypeId);
    const nextCode =
      dto.code === undefined
        ? assetType.code
        : this.normalizeCatalogCode(dto.code);
    const nextActive = dto.active ?? assetType.active;

    if (
      assetType.code === 'SUBSTATION' &&
      (nextCode !== 'SUBSTATION' || !nextActive)
    ) {
      throw new BadRequestException(
        'The SUBSTATION asset type cannot be renamed or deactivated'
      );
    }

    Object.assign(assetType, {
      code: nextCode,
      name: dto.name === undefined ? assetType.name : dto.name.trim(),
      description:
        dto.description === undefined
          ? assetType.description
          : dto.description?.trim() || null,
      active: nextActive,
    });

    return this.saveAssetType(assetType);
  }

  async listAssetTypeWorkTypes(tenantId: string, assetTypeId: string) {
    await this.assertTenantExists(tenantId);
    await this.findAssetTypeOrFail(tenantId, assetTypeId);
    const [workTypes, rules] = await Promise.all([
      this.workTypes.find({ where: { tenantId }, order: { name: 'ASC' } }),
      this.assetTypeWorkTypes.find({ where: { tenantId, assetTypeId } }),
    ]);
    const rulesByWorkType = new Map(
      rules.map((rule) => [rule.workTypeId, rule.enabled])
    );

    return workTypes.map((workType) => ({
      ...workType,
      associated: rulesByWorkType.get(workType.id) === true,
    }));
  }

  async associateAssetTypeWorkType(
    tenantId: string,
    assetTypeId: string,
    workTypeId: string
  ) {
    const [assetType, workType] = await Promise.all([
      this.findActiveAssetTypeOrFail(tenantId, assetTypeId),
      this.findActiveWorkTypeOrFail(tenantId, workTypeId),
    ]);
    let rule = await this.assetTypeWorkTypes.findOne({
      where: { tenantId, assetTypeId: assetType.id, workTypeId: workType.id },
    });

    if (rule) {
      rule.enabled = true;
    } else {
      rule = this.assetTypeWorkTypes.create({
        tenantId,
        assetTypeId: assetType.id,
        workTypeId: workType.id,
        enabled: true,
      });
    }

    await this.assetTypeWorkTypes.save(rule);
    return { assetTypeId, workTypeId, associated: true };
  }

  async disassociateAssetTypeWorkType(
    tenantId: string,
    assetTypeId: string,
    workTypeId: string
  ) {
    await Promise.all([
      this.findAssetTypeOrFail(tenantId, assetTypeId),
      this.findWorkTypeOrFail(tenantId, workTypeId),
    ]);
    await this.assetTypeWorkTypes.delete({
      tenantId,
      assetTypeId,
      workTypeId,
    });
    return { assetTypeId, workTypeId, associated: false };
  }

  async listWorkTypes(tenantId: string) {
    await this.assertTenantExists(tenantId);
    return this.workTypes.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async createWorkType(tenantId: string, dto: CreateCatalogItemDto) {
    await this.assertTenantExists(tenantId);
    const workType = this.workTypes.create({
      tenantId,
      code: this.normalizeCatalogCode(dto.code),
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      active: dto.active ?? true,
    });

    return this.saveWorkType(workType);
  }

  async updateWorkType(
    tenantId: string,
    workTypeId: string,
    dto: UpdateCatalogItemDto
  ) {
    await this.assertTenantExists(tenantId);
    const workType = await this.findWorkTypeOrFail(tenantId, workTypeId);
    Object.assign(workType, {
      code:
        dto.code === undefined
          ? workType.code
          : this.normalizeCatalogCode(dto.code),
      name: dto.name === undefined ? workType.name : dto.name.trim(),
      description:
        dto.description === undefined
          ? workType.description
          : dto.description?.trim() || null,
      active: dto.active ?? workType.active,
    });

    return this.saveWorkType(workType);
  }

  async listConcepts(tenantId: string) {
    await this.assertTenantExists(tenantId);
    const [concepts, options] = await Promise.all([
      this.concepts.find({ where: { tenantId }, order: { name: 'ASC' } }),
      this.conceptOptions.find({
        where: { tenantId },
        order: { conceptId: 'ASC', order: 'ASC' },
      }),
    ]);

    const optionsByConcept = new Map<string, ConceptOptionEntity[]>();
    for (const option of options) {
      const current = optionsByConcept.get(option.conceptId) ?? [];
      current.push(option);
      optionsByConcept.set(option.conceptId, current);
    }

    return concepts.map((concept) => ({
      ...concept,
      options: optionsByConcept.get(concept.id) ?? [],
    }));
  }

  async createConcept(tenantId: string, dto: CreateConceptDto) {
    await this.assertTenantExists(tenantId);
    const options = this.normalizeConceptOptions(dto.type, dto.options);
    const criteria = this.normalizeAnalogCriteria(dto.type, dto);
    await this.assertSeverityReferences(tenantId, [
      criteria.outOfRangeSeverityId,
      ...options.map((option) => option.suggestedSeverityId),
    ]);

    try {
      return await this.dataSource.transaction(async (manager) => {
        const conceptRepository = manager.getRepository(ConceptEntity);
        const optionRepository = manager.getRepository(ConceptOptionEntity);
        const concept = conceptRepository.create({
          tenantId,
          code: this.normalizeCatalogCode(dto.code),
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          type: dto.type,
          unit:
            dto.type === ConceptType.ANALOG ? dto.unit?.trim() || null : null,
          ...criteria,
          active: dto.active ?? true,
        });
        const saved = await conceptRepository.save(concept);
        const savedOptions = await optionRepository.save(
          options.map((option) =>
            optionRepository.create({
              ...option,
              tenantId,
              conceptId: saved.id,
            })
          )
        );
        return { ...saved, options: savedOptions };
      });
    } catch (error) {
      this.handleConceptWriteError(error);
    }
  }

  async updateConcept(
    tenantId: string,
    conceptId: string,
    dto: UpdateConceptDto
  ) {
    await this.assertTenantExists(tenantId);
    const existing = await this.findConceptOrFail(tenantId, conceptId);
    const currentOptions = await this.conceptOptions.find({
      where: { tenantId, conceptId },
      order: { order: 'ASC' },
    });
    const nextType = dto.type ?? existing.type;
    const shouldReplaceOptions =
      dto.options !== undefined || nextType !== existing.type;
    const inputOptions =
      dto.options ??
      currentOptions.map(
        ({
          value,
          label,
          order,
          active,
          generatesFinding,
          suggestedSeverityId,
        }) => ({
          value,
          label,
          order,
          active,
          generatesFinding,
          suggestedSeverityId,
        })
      );
    const options = this.normalizeConceptOptions(nextType, inputOptions);
    const criteria = this.normalizeAnalogCriteria(nextType, {
      minValue: dto.minValue === undefined ? existing.minValue : dto.minValue,
      maxValue: dto.maxValue === undefined ? existing.maxValue : dto.maxValue,
      outOfRangeSeverityId:
        dto.outOfRangeSeverityId === undefined
          ? existing.outOfRangeSeverityId
          : dto.outOfRangeSeverityId,
    });
    await this.assertSeverityReferences(tenantId, [
      criteria.outOfRangeSeverityId,
      ...options.map((option) => option.suggestedSeverityId),
    ]);

    try {
      return await this.dataSource.transaction(async (manager) => {
        const conceptRepository = manager.getRepository(ConceptEntity);
        const optionRepository = manager.getRepository(ConceptOptionEntity);
        Object.assign(existing, {
          code:
            dto.code === undefined
              ? existing.code
              : this.normalizeCatalogCode(dto.code),
          name: dto.name === undefined ? existing.name : dto.name.trim(),
          description:
            dto.description === undefined
              ? existing.description
              : dto.description?.trim() || null,
          type: nextType,
          unit:
            nextType === ConceptType.ANALOG
              ? dto.unit === undefined
                ? existing.unit
                : dto.unit?.trim() || null
              : null,
          ...criteria,
          active: dto.active ?? existing.active,
        });
        const saved = await conceptRepository.save(existing);
        let savedOptions = currentOptions;
        if (shouldReplaceOptions) {
          const existingIdByValue = new Map(
            currentOptions.map((option) => [option.value, option.id])
          );
          await optionRepository.delete({ tenantId, conceptId });
          savedOptions = await optionRepository.save(
            options.map((option) =>
              optionRepository.create({
                id: existingIdByValue.get(option.value),
                ...option,
                tenantId,
                conceptId,
              })
            )
          );
        }
        return { ...saved, options: savedOptions };
      });
    } catch (error) {
      this.handleConceptWriteError(error);
    }
  }

  async listAssetTypeConcepts(tenantId: string) {
    await this.assertTenantExists(tenantId);
    return this.assetTypeConcepts.find({
      where: { tenantId },
      order: { assetTypeId: 'ASC', order: 'ASC' },
    });
  }

  async associateAssetTypeConcept(
    tenantId: string,
    assetTypeId: string,
    conceptId: string
  ) {
    const [assetType, concept] = await Promise.all([
      this.findActiveAssetTypeOrFail(tenantId, assetTypeId),
      this.findActiveConceptOrFail(tenantId, conceptId),
    ]);
    let relation = await this.assetTypeConcepts.findOne({
      where: { tenantId, assetTypeId: assetType.id, conceptId: concept.id },
    });

    if (relation) {
      relation.active = true;
    } else {
      const count = await this.assetTypeConcepts.count({
        where: { tenantId, assetTypeId, active: true },
      });
      relation = this.assetTypeConcepts.create({
        tenantId,
        assetTypeId,
        conceptId,
        order: count + 1,
        active: true,
      });
    }

    return this.assetTypeConcepts.save(relation);
  }

  async disassociateAssetTypeConcept(
    tenantId: string,
    assetTypeId: string,
    conceptId: string
  ) {
    await Promise.all([
      this.findAssetTypeOrFail(tenantId, assetTypeId),
      this.findConceptOrFail(tenantId, conceptId),
    ]);
    const relation = await this.assetTypeConcepts.findOne({
      where: { tenantId, assetTypeId, conceptId },
    });
    if (!relation) {
      return { assetTypeId, conceptId, associated: false };
    }
    relation.active = false;
    await this.assetTypeConcepts.save(relation);
    return { ...relation, associated: false };
  }

  async listEffectiveConcepts(
    tenantId: string,
    siteId: string,
    assetId: string
  ) {
    await this.assertSiteBelongsToTenant(tenantId, siteId);
    const asset = await this.findAssetOrFail(tenantId, siteId, assetId);
    const relations = await this.assetTypeConcepts.find({
      where: { tenantId, assetTypeId: asset.assetTypeId, active: true },
      order: { order: 'ASC' },
    });
    if (relations.length === 0) return [];

    const available = await this.listConcepts(tenantId);
    const byId = new Map(available.map((concept) => [concept.id, concept]));
    return relations.flatMap((relation) => {
      const concept = byId.get(relation.conceptId);
      return concept?.active
        ? [{ ...concept, relationOrder: relation.order }]
        : [];
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

  async getAssetDescendants(tenantId: string, siteId: string, assetId: string) {
    await this.assertSiteBelongsToTenant(tenantId, siteId);
    const [root, assets] = await Promise.all([
      this.findAssetOrFail(tenantId, siteId, assetId),
      this.assets.find({
        where: { tenantId, siteId },
        order: { code: 'ASC' },
      }),
    ]);
    return collectAssetDescendants(assets, root.id);
  }

  async listEffectiveWorkTypes(
    tenantId: string,
    siteId: string,
    assetId: string
  ) {
    await this.assertSiteBelongsToTenant(tenantId, siteId);
    const asset = await this.findAssetOrFail(tenantId, siteId, assetId);
    const [workTypes, assetRules, assetTypeRules] = await Promise.all([
      this.workTypes.find({
        where: { tenantId, active: true },
        order: { name: 'ASC' },
      }),
      this.assetWorkTypes.find({ where: { tenantId, assetId } }),
      this.assetTypeWorkTypes.find({
        where: { tenantId, assetTypeId: asset.assetTypeId },
      }),
    ]);
    const assetRulesByWorkType = new Map(
      assetRules.map((rule) => [rule.workTypeId, rule])
    );
    const typeRulesByWorkType = new Map(
      assetTypeRules.map((rule) => [rule.workTypeId, rule])
    );

    return workTypes.flatMap((workType) => {
      const assetRule = assetRulesByWorkType.get(workType.id);
      if (assetRule) {
        return assetRule.enabled ? [{ ...workType, source: 'ASSET' }] : [];
      }

      return typeRulesByWorkType.get(workType.id)?.enabled
        ? [{ ...workType, source: 'ASSET_TYPE' }]
        : [];
    });
  }

  async listAssetWorkTypeConfigurations(
    tenantId: string,
    siteId: string,
    assetId: string
  ) {
    await this.assertSiteBelongsToTenant(tenantId, siteId);
    const asset = await this.findAssetOrFail(tenantId, siteId, assetId);
    const [workTypes, assetRules, assetTypeRules] = await Promise.all([
      this.workTypes.find({ where: { tenantId }, order: { name: 'ASC' } }),
      this.assetWorkTypes.find({ where: { tenantId, assetId } }),
      this.assetTypeWorkTypes.find({
        where: { tenantId, assetTypeId: asset.assetTypeId },
      }),
    ]);
    const assetRulesByWorkType = new Map(
      assetRules.map((rule) => [rule.workTypeId, rule.enabled])
    );
    const typeRulesByWorkType = new Map(
      assetTypeRules.map((rule) => [rule.workTypeId, rule.enabled])
    );

    return workTypes.map((workType) => {
      const override = assetRulesByWorkType.get(workType.id) ?? null;
      const typeEnabled = typeRulesByWorkType.get(workType.id) === true;
      const effectiveEnabled = workType.active && (override ?? typeEnabled);

      return {
        ...workType,
        typeEnabled,
        override,
        effectiveEnabled,
        source:
          override !== null ? 'ASSET' : typeEnabled ? 'ASSET_TYPE' : 'NONE',
      };
    });
  }

  async setAssetWorkTypeOverride(
    tenantId: string,
    siteId: string,
    assetId: string,
    workTypeId: string,
    enabled: boolean
  ) {
    await this.assertSiteBelongsToTenant(tenantId, siteId);
    const [asset, workType] = await Promise.all([
      this.findAssetOrFail(tenantId, siteId, assetId),
      this.findActiveWorkTypeOrFail(tenantId, workTypeId),
    ]);
    let rule = await this.assetWorkTypes.findOne({
      where: { tenantId, assetId: asset.id, workTypeId: workType.id },
    });

    if (rule) {
      rule.enabled = enabled;
    } else {
      rule = this.assetWorkTypes.create({
        tenantId,
        assetId: asset.id,
        workTypeId: workType.id,
        enabled,
      });
    }

    await this.assetWorkTypes.save(rule);
    return { assetId, workTypeId, override: enabled };
  }

  async clearAssetWorkTypeOverride(
    tenantId: string,
    siteId: string,
    assetId: string,
    workTypeId: string
  ) {
    await this.assertSiteBelongsToTenant(tenantId, siteId);
    await Promise.all([
      this.findAssetOrFail(tenantId, siteId, assetId),
      this.findWorkTypeOrFail(tenantId, workTypeId),
    ]);
    await this.assetWorkTypes.delete({ tenantId, assetId, workTypeId });
    return { assetId, workTypeId, override: null };
  }

  async createAsset(tenantId: string, siteId: string, dto: CreateAssetDto) {
    await this.assertSiteBelongsToTenant(tenantId, siteId);
    await this.assertParentIsInContext(tenantId, siteId, dto.parentId ?? null);
    const assetType = await this.assertAssetTypeBelongsToTenant(
      tenantId,
      dto.assetTypeId
    );
    this.assertRootAssetType(dto.parentId ?? null, assetType.code);

    const asset = this.assets.create({
      tenantId,
      siteId,
      code: dto.code.trim(),
      name: dto.name.trim(),
      assetTypeId: dto.assetTypeId,
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
    const nextAssetTypeId = dto.assetTypeId ?? asset.assetTypeId;
    const assetType = await this.assertAssetTypeBelongsToTenant(
      tenantId,
      nextAssetTypeId
    );

    if (nextParentId === assetId) {
      throw new BadRequestException('An asset cannot be its own parent');
    }

    await this.assertParentIsInContext(
      tenantId,
      siteId,
      nextParentId ?? null,
      assetId
    );
    this.assertRootAssetType(nextParentId ?? null, assetType.code);

    Object.assign(asset, {
      code: dto.code === undefined ? asset.code : dto.code.trim(),
      name: dto.name === undefined ? asset.name : dto.name.trim(),
      assetTypeId: nextAssetTypeId,
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
    if (
      !(await this.tenants.exist({ where: { id: tenantId, active: true } }))
    ) {
      throw new NotFoundException('Tenant not found');
    }
  }

  private async assertSiteBelongsToTenant(tenantId: string, siteId: string) {
    const exists = await this.sites.exist({ where: { id: siteId, tenantId } });
    if (!exists) {
      throw new NotFoundException('Site not found in this tenant');
    }
  }

  private async assertAssetTypeBelongsToTenant(
    tenantId: string,
    assetTypeId: string
  ) {
    let assetType: AssetTypeEntity;
    try {
      assetType = await this.findAssetTypeOrFail(tenantId, assetTypeId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new BadRequestException(
          'The asset type must belong to the selected tenant'
        );
      }
      throw error;
    }
    if (!assetType.active) {
      throw new BadRequestException('The selected asset type is inactive');
    }

    return assetType;
  }

  private async findAssetTypeOrFail(tenantId: string, assetTypeId: string) {
    const assetType = await this.assetTypes.findOne({
      where: { id: assetTypeId, tenantId },
    });
    if (!assetType) {
      throw new NotFoundException('Asset type not found in this tenant');
    }
    return assetType;
  }

  private async findSiteOrFail(tenantId: string, siteId: string) {
    const site = await this.sites.findOne({
      where: { id: siteId, tenantId },
    });
    if (!site) {
      throw new NotFoundException('Site not found in this tenant');
    }
    return site;
  }

  private async findActiveAssetTypeOrFail(
    tenantId: string,
    assetTypeId: string
  ) {
    const assetType = await this.findAssetTypeOrFail(tenantId, assetTypeId);
    if (!assetType.active) {
      throw new BadRequestException('The selected asset type is inactive');
    }
    return assetType;
  }

  private async findWorkTypeOrFail(tenantId: string, workTypeId: string) {
    const workType = await this.workTypes.findOne({
      where: { id: workTypeId, tenantId },
    });
    if (!workType) {
      throw new NotFoundException('Work type not found in this tenant');
    }
    return workType;
  }

  private async findActiveWorkTypeOrFail(tenantId: string, workTypeId: string) {
    const workType = await this.findWorkTypeOrFail(tenantId, workTypeId);
    if (!workType.active) {
      throw new BadRequestException('The selected work type is inactive');
    }
    return workType;
  }

  private async findConceptOrFail(tenantId: string, conceptId: string) {
    const concept = await this.concepts.findOne({
      where: { id: conceptId, tenantId },
    });
    if (!concept) {
      throw new NotFoundException('Concept not found in this tenant');
    }
    return concept;
  }

  private async findActiveConceptOrFail(tenantId: string, conceptId: string) {
    const concept = await this.findConceptOrFail(tenantId, conceptId);
    if (!concept.active) {
      throw new BadRequestException('The selected concept is inactive');
    }
    return concept;
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

  private async saveSite(site: SiteEntity) {
    try {
      return await this.sites.save(site);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'Another site with this code already exists in this tenant'
        );
      }
      throw error;
    }
  }

  private async saveAssetType(assetType: AssetTypeEntity) {
    try {
      return await this.assetTypes.save(assetType);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'Another asset type with this code already exists in this tenant'
        );
      }
      throw error;
    }
  }

  private async saveWorkType(workType: WorkTypeEntity) {
    try {
      return await this.workTypes.save(workType);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'Another work type with this code already exists in this tenant'
        );
      }
      throw error;
    }
  }

  private normalizeCatalogCode(code: string) {
    const normalized = code
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_');
    if (!normalized) {
      throw new BadRequestException('Code is required');
    }
    return normalized;
  }

  private normalizeConceptOptions(
    type: ConceptType,
    options: ConceptOptionDto[]
  ) {
    if (type !== ConceptType.DIGITAL) return [];
    if (options.length === 0) {
      throw new BadRequestException(
        'A DIGITAL concept requires at least one option'
      );
    }

    const normalized = options.map((option) => ({
      value: this.normalizeCatalogCode(option.value),
      label: option.label.trim(),
      order: option.order,
      active: option.active ?? true,
      generatesFinding: option.generatesFinding ?? false,
      suggestedSeverityId: option.generatesFinding
        ? option.suggestedSeverityId ?? null
        : null,
    }));
    if (
      new Set(normalized.map((option) => option.value)).size !==
      normalized.length
    ) {
      throw new BadRequestException('Concept option values must be unique');
    }
    return normalized;
  }

  private normalizeAnalogCriteria(
    type: ConceptType,
    dto: {
      minValue?: number | null;
      maxValue?: number | null;
      outOfRangeSeverityId?: string | null;
    }
  ) {
    if (type !== ConceptType.ANALOG)
      return { minValue: null, maxValue: null, outOfRangeSeverityId: null };
    const minValue = dto.minValue ?? null;
    const maxValue = dto.maxValue ?? null;
    if (minValue !== null && maxValue !== null && minValue > maxValue) {
      throw new BadRequestException('Minimum cannot exceed maximum');
    }
    if (dto.outOfRangeSeverityId && minValue === null && maxValue === null) {
      throw new BadRequestException(
        'A severity requires at least one analog limit'
      );
    }
    return {
      minValue,
      maxValue,
      outOfRangeSeverityId: dto.outOfRangeSeverityId ?? null,
    };
  }

  private async assertSeverityReferences(
    tenantId: string,
    ids: Array<string | null | undefined>
  ) {
    for (const id of new Set(ids.filter((value): value is string => !!value))) {
      const severity = await this.severityLevels.findOne({
        where: { id, tenantId },
      });
      if (!severity)
        throw new BadRequestException(
          'Suggested severity must belong to this tenant'
        );
    }
  }

  private handleConceptWriteError(error: unknown): never {
    if (this.isUniqueViolation(error)) {
      throw new ConflictException(
        'A concept or option with this code already exists in this tenant'
      );
    }
    throw error;
  }

  private isUniqueViolation(error: unknown) {
    return (
      error instanceof QueryFailedError &&
      (error.driverError as { code?: string })?.code === '23505'
    );
  }
}
