import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsObject,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export enum SyncEntityType {
  WORK = 'WORK',
  RESPONSE = 'RESPONSE',
  TASK_COMPLETION = 'TASK_COMPLETION',
  ANNOTATION = 'ANNOTATION',
}

export enum SyncOperation {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export class SyncPushChangeDto {
  @IsUUID()
  outboxId!: string;

  @IsEnum(SyncEntityType)
  entityType!: SyncEntityType;

  @IsUUID()
  entityId!: string;

  @IsEnum(SyncOperation)
  operation!: SyncOperation;

  @IsObject()
  payload!: Record<string, unknown>;

  @IsDateString()
  clientTimestamp!: string;
}

export class SyncPushRequestDto {
  @IsUUID()
  tenantId!: string;

  @IsUUID()
  deviceId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SyncPushChangeDto)
  changes!: SyncPushChangeDto[];
}

export type SyncPushResult = {
  outboxId: string;
  entityId: string;
  success: boolean;
  serverTimestamp?: string;
  error?: string;
};
