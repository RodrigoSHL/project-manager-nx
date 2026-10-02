import { ArrayMaxSize, IsArray, IsInt, IsUUID, Min } from 'class-validator';

export const PULL_BATCH_SIZE = 100;

export class SyncPullRequestDto {
  @IsInt()
  @Min(0)
  checkpoint!: number;

  @IsUUID()
  deviceId!: string;

  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  siteIds!: string[];
}

export type PullChange = {
  sequence: number;
  entityType: string;
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  sourceDeviceId?: string;
  payload?: Record<string, unknown>;
  serverUpdatedAt: string;
};

export type SyncPullResponse = {
  changes: PullChange[];
  checkpoint: number;
  hasMore: boolean;
};
