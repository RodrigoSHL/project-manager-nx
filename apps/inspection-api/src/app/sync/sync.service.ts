import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
  type SyncPushChangeDto,
  type SyncPushRequestDto,
  type SyncPushResult,
} from './dto/sync-push.dto';
import {
  SyncOperationEntity,
  SyncOperationStatus,
} from './entities/sync-operation.entity';
import { SyncChangeParser } from './sync-change.parser';
import type { ParsedChange } from './sync.types';
import { SyncWorkProcessor } from './sync-work.processor';

@Injectable()
export class SyncService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly processor: SyncWorkProcessor,
    private readonly parser: SyncChangeParser,
    @InjectRepository(SyncOperationEntity)
    private readonly operations: Repository<SyncOperationEntity>
  ) {}

  async push(
    tenantId: string,
    request: SyncPushRequestDto
  ): Promise<SyncPushResult[]> {
    if (request.tenantId !== tenantId) {
      throw new BadRequestException(
        'The request tenant does not match the authorized tenant'
      );
    }
    const outboxIds = request.changes.map((change) => change.outboxId);
    if (new Set(outboxIds).size !== outboxIds.length) {
      throw new BadRequestException('Duplicate outboxId in sync batch');
    }

    const previous = await this.operations.find({
      where: { tenantId, outboxId: In(outboxIds) },
    });
    const previousByOutbox = new Map(
      previous.map((operation) => [operation.outboxId, operation])
    );
    const results = new Map<string, SyncPushResult>();
    const groups = new Map<string, ParsedChange[]>();

    for (const change of request.changes) {
      const receipt = previousByOutbox.get(change.outboxId);
      if (receipt?.status === SyncOperationStatus.PROCESSED) {
        results.set(change.outboxId, this.successResult(change, receipt));
        continue;
      }
      try {
        const parsed = this.parser.parse(tenantId, change);
        const group = groups.get(parsed.workId) ?? [];
        group.push(parsed);
        groups.set(parsed.workId, group);
      } catch (error) {
        const message = this.errorMessage(error);
        await this.recordError(tenantId, request.deviceId, change, message);
        results.set(change.outboxId, this.failedResult(change, message));
      }
    }

    for (const changes of groups.values()) {
      const groupResults = await this.processWorkGroup(
        tenantId,
        request.deviceId,
        changes
      );
      for (const result of groupResults) results.set(result.outboxId, result);
    }

    return request.changes.map(
      (change) =>
        results.get(change.outboxId) ??
        this.failedResult(
          change,
          'The sync operation did not produce a result'
        )
    );
  }

  private async processWorkGroup(
    tenantId: string,
    deviceId: string,
    changes: ParsedChange[]
  ): Promise<SyncPushResult[]> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        for (const outboxId of changes
          .map((change) => change.outboxId)
          .sort()) {
          await manager.query(
            'SELECT pg_advisory_xact_lock(hashtext($1))',
            [`${tenantId}:${outboxId}`]
          );
        }
        const repository = manager.getRepository(SyncOperationEntity);
        const receipts = await repository.find({
          where: {
            tenantId,
            outboxId: In(changes.map((change) => change.outboxId)),
          },
        });
        const receiptByOutbox = new Map(
          receipts.map((operation) => [operation.outboxId, operation])
        );
        const pending = changes.filter(
          (change) =>
            receiptByOutbox.get(change.outboxId)?.status !==
            SyncOperationStatus.PROCESSED
        );
        if (pending.length > 0) {
          await this.processor.apply(manager, tenantId, pending);
        }

        const now = new Date();
        for (const change of pending) {
          const existing = receiptByOutbox.get(change.outboxId);
          const saved = await repository.save(
            repository.create({
              ...existing,
              tenantId,
              deviceId,
              outboxId: change.outboxId,
              entityType: change.entityType,
              entityId: change.entityId,
              operation: change.operation,
              status: SyncOperationStatus.PROCESSED,
              attempts: (existing?.attempts ?? 0) + 1,
              lastError: null,
              clientTimestamp: new Date(change.clientTimestamp),
              processedAt: now,
            })
          );
          receiptByOutbox.set(change.outboxId, saved);
        }
        return changes.map((change) =>
          this.successResult(change, receiptByOutbox.get(change.outboxId))
        );
      });
    } catch (error) {
      const message = this.errorMessage(error);
      await Promise.all(
        changes.map((change) =>
          this.recordError(tenantId, deviceId, change, message)
        )
      );
      return changes.map((change) => this.failedResult(change, message));
    }
  }

  private async recordError(
    tenantId: string,
    deviceId: string,
    change: SyncPushChangeDto,
    error: string
  ) {
    const existing = await this.operations.findOne({
      where: { tenantId, outboxId: change.outboxId },
    });
    if (existing?.status === SyncOperationStatus.PROCESSED) return;
    await this.operations.save(
      this.operations.create({
        ...existing,
        tenantId,
        deviceId,
        outboxId: change.outboxId,
        entityType: change.entityType,
        entityId: change.entityId,
        operation: change.operation,
        status: SyncOperationStatus.ERROR,
        attempts: (existing?.attempts ?? 0) + 1,
        lastError: error.slice(0, 4000),
        clientTimestamp: new Date(change.clientTimestamp),
        processedAt: null,
      })
    );
  }

  private successResult(
    change: SyncPushChangeDto,
    receipt?: SyncOperationEntity
  ): SyncPushResult {
    return {
      outboxId: change.outboxId,
      entityId: change.entityId,
      success: true,
      serverTimestamp: (
        receipt?.processedAt ??
        receipt?.updatedAt ??
        new Date()
      ).toISOString(),
    };
  }

  private failedResult(change: SyncPushChangeDto, error: string) {
    return {
      outboxId: change.outboxId,
      entityId: change.entityId,
      success: false,
      error,
    };
  }

  private errorMessage(error: unknown) {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      if (typeof response === 'string') return response;
      if (response && typeof response === 'object' && 'message' in response) {
        const message = response.message;
        return Array.isArray(message) ? message.join(', ') : String(message);
      }
    }
    return error instanceof Error ? error.message : 'Unknown sync error';
  }
}
