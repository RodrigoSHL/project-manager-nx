export interface FileStorageProvider {
  readonly name: string;
  put(storageKey: string, data: Buffer): Promise<void>;
  get(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
}

export class StorageObjectNotFoundError extends Error {}
