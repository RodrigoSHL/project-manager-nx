import { BadRequestException, Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { WorkStatus } from '../works/entities/work.entity';
import {
  SyncEntityType,
  type SyncPushChangeDto,
} from './dto/sync-push.dto';
import type {
  AnnotationPayload,
  ParsedChange,
  ResponsePayload,
  TaskPayload,
  WorkPayload,
} from './sync.types';

@Injectable()
export class SyncChangeParser {
  parse(tenantId: string, change: SyncPushChangeDto): ParsedChange {
    const payload = change.payload;
    this.assertUuid(payload.id, 'payload.id');
    this.assertUuid(payload.tenantId, 'payload.tenantId');
    if (payload.id !== change.entityId) {
      throw new BadRequestException('entityId does not match payload.id');
    }
    if (payload.tenantId !== tenantId) {
      throw new BadRequestException('Change payload belongs to another tenant');
    }
    if (change.entityType === SyncEntityType.WORK) {
      const parsed = this.parseWork(payload);
      return { ...change, workId: parsed.id, parsedPayload: parsed };
    }
    this.assertUuid(payload.workId, 'payload.workId');
    const workId = payload.workId;
    if (change.entityType === SyncEntityType.RESPONSE) {
      return { ...change, workId, parsedPayload: this.parseResponse(payload) };
    }
    if (change.entityType === SyncEntityType.TASK_COMPLETION) {
      return { ...change, workId, parsedPayload: this.parseTask(payload) };
    }
    return {
      ...change,
      workId,
      parsedPayload: this.parseAnnotation(payload),
    };
  }

  private parseWork(payload: Record<string, unknown>): WorkPayload {
    for (const key of [
      'siteId',
      'assetId',
      'workTypeId',
      'formTemplateId',
    ]) {
      this.assertUuid(payload[key], `payload.${key}`);
    }
    const status = payload.status;
    if (!Object.values(WorkStatus).includes(status as WorkStatus)) {
      throw new BadRequestException('Invalid work status');
    }
    const version = payload.formTemplateVersion;
    if (!Number.isInteger(version) || Number(version) < 1) {
      throw new BadRequestException('Invalid form template version');
    }
    return {
      id: payload.id as string,
      tenantId: payload.tenantId as string,
      siteId: payload.siteId as string,
      assetId: payload.assetId as string,
      workTypeId: payload.workTypeId as string,
      formTemplateId: payload.formTemplateId as string,
      formTemplateVersion: Number(version),
      title: this.requiredText(payload.title, 'title', 200, 3),
      executionDate: this.requiredDate(payload.executionDate),
      responsible: this.requiredText(
        payload.responsible,
        'responsible',
        160,
        2
      ),
      company: this.optionalText(payload.company, 'company', 160),
      status: status as WorkStatus,
      notes: this.optionalText(payload.notes, 'notes'),
    };
  }

  private parseResponse(payload: Record<string, unknown>): ResponsePayload {
    for (const key of ['workId', 'formItemId', 'conceptId']) {
      this.assertUuid(payload[key], `payload.${key}`);
    }
    if (
      payload.valueNumber !== undefined &&
      typeof payload.valueNumber !== 'number'
    ) {
      throw new BadRequestException('valueNumber must be numeric');
    }
    if (payload.selectedOptionId !== undefined) {
      this.assertUuid(payload.selectedOptionId, 'payload.selectedOptionId');
    }
    return {
      id: payload.id as string,
      tenantId: payload.tenantId as string,
      workId: payload.workId as string,
      formItemId: payload.formItemId as string,
      conceptId: payload.conceptId as string,
      valueNumber: payload.valueNumber as number | undefined,
      valueText: this.optionalText(payload.valueText, 'valueText'),
      selectedOptionId: payload.selectedOptionId as string | undefined,
    };
  }

  private parseTask(payload: Record<string, unknown>): TaskPayload {
    this.assertUuid(payload.formItemId, 'payload.formItemId');
    if (typeof payload.completed !== 'boolean') {
      throw new BadRequestException('completed must be boolean');
    }
    return {
      id: payload.id as string,
      tenantId: payload.tenantId as string,
      workId: payload.workId as string,
      formItemId: payload.formItemId as string,
      completed: payload.completed,
    };
  }

  private parseAnnotation(payload: Record<string, unknown>): AnnotationPayload {
    this.assertUuid(payload.formItemId, 'payload.formItemId');
    return {
      id: payload.id as string,
      tenantId: payload.tenantId as string,
      workId: payload.workId as string,
      formItemId: payload.formItemId as string,
      comment: this.requiredText(payload.comment, 'comment', 2000, 1),
    };
  }

  private assertUuid(value: unknown, name: string): asserts value is string {
    if (typeof value !== 'string' || !isUUID(value)) {
      throw new BadRequestException(`${name} must be a UUID`);
    }
  }

  private requiredText(
    value: unknown,
    name: string,
    maxLength: number,
    minLength: number
  ) {
    if (typeof value !== 'string') {
      throw new BadRequestException(`${name} must be text`);
    }
    const normalized = value.trim();
    if (normalized.length < minLength || normalized.length > maxLength) {
      throw new BadRequestException(`${name} has an invalid length`);
    }
    return normalized;
  }

  private optionalText(value: unknown, name: string, maxLength = 10000) {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value !== 'string' || value.length > maxLength) {
      throw new BadRequestException(`${name} must be valid text`);
    }
    return value.trim() || undefined;
  }

  private requiredDate(value: unknown) {
    if (
      typeof value !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}/.test(value) ||
      Number.isNaN(Date.parse(value))
    ) {
      throw new BadRequestException('executionDate must be a valid date');
    }
    return value.slice(0, 10);
  }
}
