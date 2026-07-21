import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { TravelApiClient } from '../travel-api/travel-api.client';

export interface FileRecord {
  id: string;
  application: string;
  ownerType: string | null;
  ownerId: string | null;
  originalName: string;
  mimeType: string;
  size: number;
  metadata: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface IncomingImage {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

const APPLICATION = 'travel-planner-app';
const OWNER_TYPE = 'activity';
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_SIZE = Number(process.env.FILES_MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024);

@Injectable()
export class FilesApiService {
  private readonly logger = new Logger(FilesApiService.name);
  private readonly baseUrl = (process.env.FILES_API_URL || 'http://localhost:3004/api').replace(/\/$/, '');

  constructor(private readonly travelApi: TravelApiClient) {}

  async upload(file: IncomingImage | undefined, body: Record<string, string>, user: AuthenticatedUser) {
    if (!file) throw new BadRequestException('A file is required');
    if (!ALLOWED_TYPES.has(file.mimetype)) throw new UnsupportedMediaTypeException('Only JPG, PNG and WebP images are allowed');
    if (file.size > MAX_SIZE) throw new HttpException('The image exceeds the configured size limit', 413);
    this.assertFixedOwner(body.application, body.ownerType);
    this.assertUuid(body.ownerId, 'ownerId');

    const metadata = this.parseMetadata(body.metadata);
    const tripId = String(metadata.tripId || '');
    this.assertUuid(tripId, 'metadata.tripId');
    if (metadata.category !== 'activity-photo') throw new BadRequestException('metadata.category must be activity-photo');
    await this.travelApi.getActivity(tripId, body.ownerId, user);

    const form = new FormData();
    form.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
    form.append('application', APPLICATION);
    form.append('ownerType', OWNER_TYPE);
    form.append('ownerId', body.ownerId);
    form.append('metadata', JSON.stringify(metadata));
    return this.json('/files', { method: 'POST', body: form });
  }

  async list(query: Record<string, string>, user: AuthenticatedUser): Promise<FileRecord[]> {
    this.assertFixedOwner(query.application, query.ownerType);
    this.assertUuid(query.ownerId, 'ownerId');
    const files = await this.json<FileRecord[]>(`/files?application=${APPLICATION}&ownerType=${OWNER_TYPE}&ownerId=${encodeURIComponent(query.ownerId)}`);
    if (files.length) await this.authorize(files[0], user);
    return files.filter((file) => this.isActivityPhoto(file));
  }

  async get(id: string, user: AuthenticatedUser): Promise<FileRecord> {
    this.assertUuid(id, 'id');
    const file = await this.json<FileRecord>(`/files/${id}`);
    await this.authorize(file, user);
    return file;
  }

  async content(id: string, user: AuthenticatedUser): Promise<Response> {
    await this.get(id, user);
    return this.request(`/files/${id}/content`);
  }

  async remove(id: string, user: AuthenticatedUser): Promise<void> {
    await this.get(id, user);
    await this.request(`/files/${id}`, { method: 'DELETE' });
  }

  async filesForCleanup(tripId: string, activityId: string, user: AuthenticatedUser): Promise<FileRecord[]> {
    await this.travelApi.getActivity(tripId, activityId, user);
    return this.json<FileRecord[]>(`/files?application=${APPLICATION}&ownerType=${OWNER_TYPE}&ownerId=${encodeURIComponent(activityId)}`);
  }

  async cleanup(files: FileRecord[]): Promise<void> {
    const results = await Promise.allSettled(files.filter((file) => this.isActivityPhoto(file)).map((file) => this.request(`/files/${file.id}`, { method: 'DELETE' })));
    const failures = results.filter((result) => result.status === 'rejected').length;
    if (failures) this.logger.error(`Activity deleted, but ${failures} photo(s) could not be cleaned up`);
  }

  private async authorize(file: FileRecord, user: AuthenticatedUser) {
    if (!this.isActivityPhoto(file)) throw new ForbiddenException('The file is not an activity photo');
    const tripId = String(file.metadata?.tripId || '');
    this.assertUuid(tripId, 'metadata.tripId');
    await this.travelApi.getActivity(tripId, String(file.ownerId), user);
  }

  private isActivityPhoto(file: FileRecord) {
    return file.application === APPLICATION && file.ownerType === OWNER_TYPE && file.metadata?.category === 'activity-photo';
  }

  private assertFixedOwner(application?: string, ownerType?: string) {
    if (application !== APPLICATION || ownerType !== OWNER_TYPE) throw new BadRequestException('Only travel-planner-app activity photos are supported');
  }

  private assertUuid(value: string | undefined, field: string) {
    if (!value || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new BadRequestException(`${field} must be a UUID`);
  }

  private parseMetadata(value?: string): Record<string, unknown> {
    try {
      const parsed = JSON.parse(value || '');
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error();
      return parsed;
    } catch {
      throw new BadRequestException('metadata must be valid JSON');
    }
  }

  private async json<T = unknown>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.request(path, init);
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  private async request(path: string, init?: RequestInit): Promise<Response> {
    let response: Response;
    try { response = await fetch(`${this.baseUrl}${path}`, init); }
    catch { throw new ServiceUnavailableException('Files API is unavailable'); }
    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: 'Files API error' }));
      throw new HttpException(body, [400, 401, 403, 404, 413].includes(response.status) ? response.status : 500);
    }
    return response;
  }
}
