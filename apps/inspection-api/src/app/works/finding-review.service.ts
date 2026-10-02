import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { SeverityLevelEntity } from '../catalog/entities/severity-level.entity';
import { AssetEntity } from '../catalog/entities/asset.entity';
import {
  ConfirmFindingDto,
  DiscardFindingCandidateDto,
} from './dto/review-finding.dto';
import {
  FindingCandidateEntity,
  FindingSource,
  FindingStatus,
} from './entities/finding-candidate.entity';
import { FindingEntity } from './entities/finding.entity';
import { WorkEntity, WorkStatus } from './entities/work.entity';

@Injectable()
export class FindingReviewService {
  constructor(private readonly dataSource: DataSource) {}

  async confirm(
    tenantId: string,
    workId: string,
    candidateId: string,
    dto: ConfirmFindingDto
  ) {
    return this.dataSource.transaction(async (manager) => {
      const work = await this.reviewableWork(manager, tenantId, workId);
      const candidate = await manager.findOne(FindingCandidateEntity, {
        where: { id: candidateId, tenantId, workId },
      });
      if (!candidate)
        throw new NotFoundException('Finding candidate not found');
      if (candidate.status === FindingStatus.DISCARDED)
        throw new BadRequestException(
          'A discarded candidate cannot be confirmed'
        );
      const title = dto.title?.trim();
      if (!title) throw new BadRequestException('Finding title is required');
      if (
        dto.manHours != null &&
        (!Number.isFinite(dto.manHours) || dto.manHours < 0)
      ) {
        throw new BadRequestException(
          'Man-hours must be a non-negative finite number'
        );
      }
      if (dto.severityId) {
        const severity = await manager.findOne(SeverityLevelEntity, {
          where: { id: dto.severityId, tenantId },
        });
        if (!severity)
          throw new BadRequestException(
            'Severity does not belong to this tenant'
          );
      }
      const items = work.formSnapshot.sections.flatMap(
        (section) => section.items
      );
      const itemOrder = items.findIndex(
        (item) => item.id === candidate.workItemId
      );
      if (itemOrder < 0)
        throw new BadRequestException(
          'Candidate item is missing from the work snapshot'
        );
      const sortOrder =
        itemOrder * 3 +
        {
          [FindingSource.ANALOG]: 0,
          [FindingSource.DIGITAL]: 1,
          [FindingSource.MANUAL]: 2,
        }[candidate.source];
      const item = items[itemOrder];
      const asset = !item.assetNameSnapshot
        ? await manager.findOne(AssetEntity, {
            where: { id: candidate.assetId, tenantId },
          })
        : null;
      const existing = await manager.findOne(FindingEntity, {
        where: { sourceCandidateId: candidate.id },
      });
      const finding = manager.create(FindingEntity, {
        ...(existing ?? {}),
        tenantId,
        workId,
        workItemId: candidate.workItemId,
        assetId: candidate.assetId,
        conceptId: candidate.conceptId ?? null,
        sourceCandidateId: candidate.id,
        source: candidate.source,
        title,
        description: dto.description?.trim() || null,
        measuredValue: candidate.measuredValue ?? null,
        minValue: candidate.minValue ?? null,
        maxValue: candidate.maxValue ?? null,
        severityId: dto.severityId || null,
        manHours: dto.manHours ?? null,
        materials: dto.materials?.trim() || null,
        assetNameSnapshot:
          existing?.assetNameSnapshot ??
          item.assetNameSnapshot ??
          asset?.name ??
          work.title,
        conceptNameSnapshot:
          existing?.conceptNameSnapshot ?? item.concept?.name ?? null,
        unitSnapshot: existing?.unitSnapshot ?? item.concept?.unit ?? null,
        sortOrder: existing?.sortOrder ?? sortOrder,
      });
      const saved = await manager.save(FindingEntity, finding);
      if (candidate.status !== FindingStatus.CONFIRMED) {
        candidate.status = FindingStatus.CONFIRMED;
        candidate.discardReason = null;
        await manager.save(FindingCandidateEntity, candidate);
      }
      return saved;
    });
  }

  async discard(
    tenantId: string,
    workId: string,
    candidateId: string,
    dto: DiscardFindingCandidateDto
  ) {
    return this.dataSource.transaction(async (manager) => {
      await this.reviewableWork(manager, tenantId, workId);
      const candidate = await manager.findOne(FindingCandidateEntity, {
        where: { id: candidateId, tenantId, workId },
      });
      if (!candidate)
        throw new NotFoundException('Finding candidate not found');
      if (candidate.status === FindingStatus.CONFIRMED)
        throw new BadRequestException(
          'A confirmed finding cannot be discarded'
        );
      candidate.status = FindingStatus.DISCARDED;
      candidate.discardReason = dto.reason?.trim() || null;
      return manager.save(FindingCandidateEntity, candidate);
    });
  }

  async finalize(tenantId: string, workId: string) {
    return this.dataSource.transaction(async (manager) => {
      const work = await this.reviewableWork(manager, tenantId, workId);
      const pending = await manager.count(FindingCandidateEntity, {
        where: { tenantId, workId, status: FindingStatus.PENDING },
      });
      if (pending)
        throw new BadRequestException(
          `Aún existen ${pending} posibles hallazgos pendientes de revisión.`
        );
      work.status = WorkStatus.REVIEWED;
      return manager.save(WorkEntity, work);
    });
  }

  private async reviewableWork(
    manager: EntityManager,
    tenantId: string,
    workId: string
  ) {
    const work = await manager.findOne(WorkEntity, {
      where: { id: workId, tenantId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!work) throw new NotFoundException('Work not found');
    if (work.status !== WorkStatus.FINISHED)
      throw new BadRequestException('Only finished works can be reviewed');
    return work;
  }
}
