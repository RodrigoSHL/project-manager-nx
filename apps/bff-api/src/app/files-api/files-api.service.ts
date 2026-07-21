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

export interface IncomingFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

const APPLICATION = 'travel-planner-app';
const OWNER_TYPE = 'activity';
const TRAVELER_OWNER_TYPE = 'traveler-document';
const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const DOCUMENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);
const CATEGORIES = new Set(['activity-photo', 'activity-document']);
const TRAVELER_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/heif']);
const MAX_SIZE = Number(process.env.FILES_MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024);

@Injectable()
export class FilesApiService {
  private readonly logger = new Logger(FilesApiService.name);
  private readonly baseUrl = (process.env.FILES_API_URL || 'http://localhost:3004/api').replace(/\/$/, '');

  constructor(private readonly travelApi: TravelApiClient) {}

  async upload(file: IncomingFile | undefined, body: Record<string, string>, user: AuthenticatedUser) {
    if (!file) throw new BadRequestException('A file is required');
    if (file.size > MAX_SIZE) throw new HttpException('The file exceeds the configured size limit', 413);
    this.assertSupportedOwner(body.application, body.ownerType);
    this.assertUuid(body.ownerId, 'ownerId');

    const metadata = this.parseMetadata(body.metadata);
    const category = String(metadata.category || '');
    const travelerDocument = body.ownerType === TRAVELER_OWNER_TYPE;
    if (travelerDocument && category !== 'traveler-document') throw new BadRequestException('metadata.category must be traveler-document');
    if (!travelerDocument && !CATEGORIES.has(category)) throw new BadRequestException('metadata.category must be activity-photo or activity-document');
    const allowedTypes = travelerDocument ? TRAVELER_TYPES : category === 'activity-photo' ? PHOTO_TYPES : DOCUMENT_TYPES;
    if (!allowedTypes.has(file.mimetype)) throw new UnsupportedMediaTypeException(category === 'activity-photo' ? 'Only JPG, PNG and WebP images are allowed' : 'Only PDF, Word, Excel and text documents are allowed');
    if (travelerDocument) await this.travelApi.travelerGet(`/documents/${body.ownerId}`, user);
    else { const tripId = String(metadata.tripId || ''); this.assertUuid(tripId, 'metadata.tripId'); await this.travelApi.getActivity(tripId, body.ownerId, user); }

    const form = new FormData();
    form.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
    form.append('application', APPLICATION);
    form.append('ownerType', body.ownerType);
    form.append('ownerId', body.ownerId);
    form.append('metadata', JSON.stringify(metadata));
    return this.json('/files', { method: 'POST', body: form });
  }

  async list(query: Record<string, string>, user: AuthenticatedUser): Promise<FileRecord[]> {
    this.assertSupportedOwner(query.application, query.ownerType);
    this.assertUuid(query.ownerId, 'ownerId');
    const files = await this.json<FileRecord[]>(`/files?application=${APPLICATION}&ownerType=${encodeURIComponent(String(query.ownerType))}&ownerId=${encodeURIComponent(query.ownerId)}`);
    if (query.ownerType === TRAVELER_OWNER_TYPE) { await this.travelApi.travelerGet(`/documents/${query.ownerId}`, user); return files.filter(file=>this.isTravelerDocument(file)); }
    const activityAsset = files.find((file) => this.isActivityAsset(file));
    if (activityAsset) await this.authorize(activityAsset, user);
    const category = query.category;
    if (category && !CATEGORIES.has(category)) throw new BadRequestException('Unsupported category');
    return files.filter((file) => this.isActivityAsset(file) && (!category || file.metadata?.category === category));
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
    const results = await Promise.allSettled(files.filter((file) => this.isActivityAsset(file)).map((file) => this.request(`/files/${file.id}`, { method: 'DELETE' })));
    const failures = results.filter((result) => result.status === 'rejected').length;
    if (failures) this.logger.error(`Activity deleted, but ${failures} photo(s) could not be cleaned up`);
  }

  private async authorize(file: FileRecord, user: AuthenticatedUser) {
    if (this.isTravelerDocument(file)) { await this.travelApi.travelerGet(`/documents/${file.ownerId}`, user); return; }
    if (!this.isActivityAsset(file)) throw new ForbiddenException('The file is not an activity asset');
    const tripId = String(file.metadata?.tripId || '');
    this.assertUuid(tripId, 'metadata.tripId');
    await this.travelApi.getActivity(tripId, String(file.ownerId), user);
  }

  private isActivityAsset(file: FileRecord) {
    return file.application === APPLICATION && file.ownerType === OWNER_TYPE && CATEGORIES.has(String(file.metadata?.category || ''));
  }

  private isTravelerDocument(file:FileRecord){return file.application===APPLICATION&&file.ownerType===TRAVELER_OWNER_TYPE&&file.metadata?.category==='traveler-document'}

  private assertSupportedOwner(application?:string,ownerType?:string){if(application!==APPLICATION||![OWNER_TYPE,TRAVELER_OWNER_TYPE].includes(ownerType||''))throw new BadRequestException('Unsupported file owner')}

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
