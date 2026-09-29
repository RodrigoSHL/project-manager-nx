import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  GeneratedReportEntity,
  GeneratedReportStatus,
} from './entities/generated-report.entity';
import {
  FindingCandidateEntity,
  FindingStatus,
} from './entities/finding-candidate.entity';
import { WorkEntity, WorkStatus } from './entities/work.entity';

@Injectable()
export class GeneratedReportsService {
  constructor(private readonly db: DataSource) {}

  list(tenantId: string, workId: string) {
    return this.db.getRepository(GeneratedReportEntity).find({
      where: { tenantId, workId },
      order: { version: 'DESC' },
    });
  }

  async get(tenantId: string, workId: string, reportId: string) {
    const report = await this.db.getRepository(GeneratedReportEntity).findOne({
      where: { id: reportId, tenantId, workId },
    });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async create(
    tenantId: string,
    workId: string,
    status: GeneratedReportStatus,
    reportSnapshot: Record<string, unknown>,
    generatedBy?: string
  ) {
    if (!Object.values(GeneratedReportStatus).includes(status))
      throw new BadRequestException('Invalid report status');
    if (
      !reportSnapshot ||
      typeof reportSnapshot !== 'object' ||
      Array.isArray(reportSnapshot) ||
      !Array.isArray(reportSnapshot.sections) ||
      !Array.isArray(reportSnapshot.findings) ||
      !reportSnapshot.header ||
      typeof reportSnapshot.header !== 'object'
    )
      throw new BadRequestException('Invalid report snapshot');
    const header = reportSnapshot.header as Record<string, unknown>;
    if (header.tenantId !== tenantId || header.workId !== workId)
      throw new BadRequestException('Report does not match tenant and work');
    return this.db.transaction(async (manager) => {
      const work = await manager.findOne(WorkEntity, {
        where: { id: workId, tenantId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!work) throw new NotFoundException('Work not found');
      if (![WorkStatus.FINISHED, WorkStatus.REVIEWED].includes(work.status))
        throw new BadRequestException(
          'Finish the work before saving a report version'
        );
      if (status === GeneratedReportStatus.FINAL) {
        if (work.status !== WorkStatus.REVIEWED)
          throw new BadRequestException(
            'Finish the finding review before finalizing the report'
          );
        const pending = await manager.count(FindingCandidateEntity, {
          where: { tenantId, workId, status: FindingStatus.PENDING },
        });
        if (pending)
          throw new BadRequestException(
            'Pending finding candidates prevent a final report'
          );
      }
      const latest = await manager.findOne(GeneratedReportEntity, {
        where: { tenantId, workId },
        order: { version: 'DESC' },
      });
      const report = manager.create(GeneratedReportEntity, {
        tenantId,
        workId,
        version: (latest?.version ?? 0) + 1,
        status,
        reportSnapshot,
        generatedBy: generatedBy?.trim() || null,
      });
      return manager.save(report);
    });
  }
}
