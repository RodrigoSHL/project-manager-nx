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
import { ProjectAccessService } from '../project-api/project-access.service';
import { ProjectApiClient } from '../project-api/project-api.client';
import { TravelApiClient } from '../travel-api/travel-api.client';
import { InspectionApiClient } from '../inspection-api/inspection-api.client';
import { UserRole } from '../user-api/user-api.client';

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

const TRAVEL_APPLICATION = 'travel-planner-app';
const JIRA_APPLICATION = 'jira-web';
const INSPECTION_APPLICATION = 'inspection-web';
const ACTIVITY_OWNER_TYPE = 'activity';
const TICKET_OWNER_TYPE = 'ticket';
const TRAVELER_OWNER_TYPE = 'traveler-document';
const WORK_OWNER_TYPE = 'work';
const WORK_PHOTO_CATEGORY = 'work-item-photo';
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
const TRAVELER_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
]);
const TICKET_ATTACHMENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/csv',
  'text/plain',
]);
const MAX_SIZE = Number(
  process.env.FILES_MAX_FILE_SIZE_BYTES || 10 * 1024 * 1024
);

@Injectable()
export class FilesApiService {
  private readonly logger = new Logger(FilesApiService.name);
  private readonly baseUrl = (
    process.env.FILES_API_URL || 'http://localhost:3004/api'
  ).replace(/\/$/, '');

  constructor(
    private readonly travelApi: TravelApiClient,
    private readonly projectApi: ProjectApiClient,
    private readonly projectAccess: ProjectAccessService,
    private readonly inspectionApi: InspectionApiClient
  ) {}

  async upload(
    file: IncomingFile | undefined,
    body: Record<string, string>,
    user: AuthenticatedUser
  ) {
    if (!file) throw new BadRequestException('A file is required');
    if (file.size > MAX_SIZE)
      throw new HttpException(
        'The file exceeds the configured size limit',
        413
      );
    this.assertSupportedOwner(body.application, body.ownerType);
    this.assertUuid(body.ownerId, 'ownerId');

    const metadata = this.parseMetadata(body.metadata);
    let category = String(metadata.category || '');
    const ticketAttachment =
      body.application === JIRA_APPLICATION &&
      body.ownerType === TICKET_OWNER_TYPE;
    const travelerDocument = body.ownerType === TRAVELER_OWNER_TYPE;
    const inspectionPhoto =
      body.application === INSPECTION_APPLICATION &&
      body.ownerType === WORK_OWNER_TYPE;
    if (ticketAttachment) {
      category = 'ticket-attachment';
      const projectId = String(metadata.projectId || '');
      this.assertUuid(projectId, 'metadata.projectId');
      if (!TICKET_ATTACHMENT_TYPES.has(file.mimetype)) {
        throw new UnsupportedMediaTypeException(
          'Only images, PDF, Word, Excel, PowerPoint, CSV and text files are allowed'
        );
      }
      await this.authorizeJiraTicket(projectId, body.ownerId, user);
      metadata.category = category;
      metadata.projectId = projectId;
      metadata.uploadedBy = user.userId;
    }
    if (inspectionPhoto) {
      const tenantId = String(metadata.tenantId || '');
      const formItemId = String(metadata.formItemId || '');
      this.assertUuid(tenantId, 'metadata.tenantId');
      this.assertUuid(formItemId, 'metadata.formItemId');
      if (category !== WORK_PHOTO_CATEGORY) {
        throw new BadRequestException(
          'metadata.category must be work-item-photo'
        );
      }
      if (!PHOTO_TYPES.has(file.mimetype)) {
        throw new UnsupportedMediaTypeException(
          'Only JPG, PNG and WebP images are allowed'
        );
      }
      await this.authorizeInspectionWork(
        tenantId,
        body.ownerId,
        user,
        formItemId,
        true
      );
      metadata.category = WORK_PHOTO_CATEGORY;
      metadata.tenantId = tenantId;
      metadata.formItemId = formItemId;
      metadata.uploadedBy = user.userId;
    }
    if (travelerDocument && category !== 'traveler-document')
      throw new BadRequestException(
        'metadata.category must be traveler-document'
      );
    if (
      !ticketAttachment &&
      !travelerDocument &&
      !inspectionPhoto &&
      !CATEGORIES.has(category)
    )
      throw new BadRequestException(
        'metadata.category must be activity-photo or activity-document'
      );
    const allowedTypes = travelerDocument
      ? TRAVELER_TYPES
      : category === 'activity-photo'
      ? PHOTO_TYPES
      : DOCUMENT_TYPES;
    if (
      !ticketAttachment &&
      !inspectionPhoto &&
      !allowedTypes.has(file.mimetype)
    )
      throw new UnsupportedMediaTypeException(
        category === 'activity-photo'
          ? 'Only JPG, PNG and WebP images are allowed'
          : 'Only PDF, Word, Excel and text documents are allowed'
      );
    if (travelerDocument)
      await this.travelApi.travelerGet(`/documents/${body.ownerId}`, user);
    else if (!ticketAttachment && !inspectionPhoto) {
      const tripId = String(metadata.tripId || '');
      this.assertUuid(tripId, 'metadata.tripId');
      await this.travelApi.getActivity(tripId, body.ownerId, user);
    }

    const form = new FormData();
    form.append(
      'file',
      new Blob([file.buffer], { type: file.mimetype }),
      file.originalname
    );
    form.append(
      'application',
      ticketAttachment
        ? JIRA_APPLICATION
        : inspectionPhoto
        ? INSPECTION_APPLICATION
        : TRAVEL_APPLICATION
    );
    form.append('ownerType', body.ownerType);
    form.append('ownerId', body.ownerId);
    form.append('metadata', JSON.stringify(metadata));
    return this.json('/files', { method: 'POST', body: form });
  }

  async list(
    query: Record<string, string>,
    user: AuthenticatedUser
  ): Promise<FileRecord[]> {
    this.assertSupportedOwner(query.application, query.ownerType);
    this.assertUuid(query.ownerId, 'ownerId');
    if (
      query.application === INSPECTION_APPLICATION &&
      query.ownerType === WORK_OWNER_TYPE
    ) {
      const tenantId = String(query.tenantId || '');
      this.assertUuid(tenantId, 'tenantId');
      await this.authorizeInspectionWork(tenantId, query.ownerId, user);
      const files = await this.json<FileRecord[]>(
        `/files?application=${INSPECTION_APPLICATION}&ownerType=${WORK_OWNER_TYPE}&ownerId=${encodeURIComponent(
          query.ownerId
        )}`
      );
      return files.filter(
        (file) =>
          this.isInspectionWorkPhoto(file) &&
          file.metadata?.tenantId === tenantId
      );
    }
    if (
      query.application === JIRA_APPLICATION &&
      query.ownerType === TICKET_OWNER_TYPE
    ) {
      const projectId = String(query.projectId || '');
      this.assertUuid(projectId, 'projectId');
      await this.authorizeJiraTicket(projectId, query.ownerId, user);
      const files = await this.json<FileRecord[]>(
        `/files?application=${JIRA_APPLICATION}&ownerType=${TICKET_OWNER_TYPE}&ownerId=${encodeURIComponent(
          query.ownerId
        )}`
      );
      return files.filter(
        (file) =>
          this.isTicketAttachment(file) &&
          file.metadata?.projectId === projectId
      );
    }
    const files = await this.json<FileRecord[]>(
      `/files?application=${TRAVEL_APPLICATION}&ownerType=${encodeURIComponent(
        String(query.ownerType)
      )}&ownerId=${encodeURIComponent(query.ownerId)}`
    );
    if (query.ownerType === TRAVELER_OWNER_TYPE) {
      await this.travelApi.travelerGet(`/documents/${query.ownerId}`, user);
      return files.filter((file) => this.isTravelerDocument(file));
    }
    const activityAsset = files.find((file) => this.isActivityAsset(file));
    if (activityAsset) await this.authorize(activityAsset, user);
    const category = query.category;
    if (category && !CATEGORIES.has(category))
      throw new BadRequestException('Unsupported category');
    return files.filter(
      (file) =>
        this.isActivityAsset(file) &&
        (!category || file.metadata?.category === category)
    );
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
    this.assertUuid(id, 'id');
    const file = await this.json<FileRecord>(`/files/${id}`);
    await this.authorize(file, user, true);
    await this.request(`/files/${id}`, { method: 'DELETE' });
  }

  async filesForCleanup(
    tripId: string,
    activityId: string,
    user: AuthenticatedUser
  ): Promise<FileRecord[]> {
    await this.travelApi.getActivity(tripId, activityId, user);
    return this.json<FileRecord[]>(
      `/files?application=${TRAVEL_APPLICATION}&ownerType=${ACTIVITY_OWNER_TYPE}&ownerId=${encodeURIComponent(
        activityId
      )}`
    );
  }

  async cleanup(files: FileRecord[]): Promise<void> {
    const results = await Promise.allSettled(
      files
        .filter((file) => this.isActivityAsset(file))
        .map((file) => this.request(`/files/${file.id}`, { method: 'DELETE' }))
    );
    const failures = results.filter(
      (result) => result.status === 'rejected'
    ).length;
    if (failures)
      this.logger.error(
        `Activity deleted, but ${failures} photo(s) could not be cleaned up`
      );
  }

  private async authorize(
    file: FileRecord,
    user: AuthenticatedUser,
    requireEditable = false
  ) {
    if (this.isTicketAttachment(file)) {
      const projectId = String(file.metadata?.projectId || '');
      this.assertUuid(projectId, 'metadata.projectId');
      await this.authorizeJiraTicket(projectId, String(file.ownerId), user);
      return;
    }
    if (this.isTravelerDocument(file)) {
      await this.travelApi.travelerGet(`/documents/${file.ownerId}`, user);
      return;
    }
    if (this.isInspectionWorkPhoto(file)) {
      const tenantId = String(file.metadata?.tenantId || '');
      const formItemId = String(file.metadata?.formItemId || '');
      this.assertUuid(tenantId, 'metadata.tenantId');
      this.assertUuid(formItemId, 'metadata.formItemId');
      await this.authorizeInspectionWork(
        tenantId,
        String(file.ownerId),
        user,
        formItemId,
        requireEditable
      );
      return;
    }
    if (!this.isActivityAsset(file))
      throw new ForbiddenException('The file is not an activity asset');
    const tripId = String(file.metadata?.tripId || '');
    this.assertUuid(tripId, 'metadata.tripId');
    await this.travelApi.getActivity(tripId, String(file.ownerId), user);
  }

  private isActivityAsset(file: FileRecord) {
    return (
      file.application === TRAVEL_APPLICATION &&
      file.ownerType === ACTIVITY_OWNER_TYPE &&
      CATEGORIES.has(String(file.metadata?.category || ''))
    );
  }

  private isTravelerDocument(file: FileRecord) {
    return (
      file.application === TRAVEL_APPLICATION &&
      file.ownerType === TRAVELER_OWNER_TYPE &&
      file.metadata?.category === 'traveler-document'
    );
  }

  private isTicketAttachment(file: FileRecord) {
    return (
      file.application === JIRA_APPLICATION &&
      file.ownerType === TICKET_OWNER_TYPE &&
      file.metadata?.category === 'ticket-attachment'
    );
  }

  private isInspectionWorkPhoto(file: FileRecord) {
    return (
      file.application === INSPECTION_APPLICATION &&
      file.ownerType === WORK_OWNER_TYPE &&
      file.metadata?.category === WORK_PHOTO_CATEGORY
    );
  }

  private assertSupportedOwner(application?: string, ownerType?: string) {
    const travelOwner =
      application === TRAVEL_APPLICATION &&
      [ACTIVITY_OWNER_TYPE, TRAVELER_OWNER_TYPE].includes(ownerType || '');
    const jiraOwner =
      application === JIRA_APPLICATION && ownerType === TICKET_OWNER_TYPE;
    const inspectionOwner =
      application === INSPECTION_APPLICATION && ownerType === WORK_OWNER_TYPE;
    if (!travelOwner && !jiraOwner && !inspectionOwner)
      throw new BadRequestException('Unsupported file owner');
  }

  private async authorizeInspectionWork(
    tenantId: string,
    workId: string,
    user: AuthenticatedUser,
    formItemId?: string,
    requireEditable = false
  ) {
    if (!user.roles.includes(UserRole.ADMIN)) {
      const { hasAccess } = await this.inspectionApi.hasTenantAccess(
        user.userId,
        tenantId
      );
      if (!hasAccess) throw new ForbiddenException('Tenant access denied');
    }
    const result = (await this.inspectionApi.getWork(tenantId, workId)) as {
      work: { status: string };
      snapshot: { sections: Array<{ items: Array<{ id: string }> }> };
    };
    if (
      formItemId &&
      !result.snapshot.sections.some((section) =>
        section.items.some((item) => item.id === formItemId)
      )
    ) {
      throw new ForbiddenException('Form item does not belong to this work');
    }
    if (
      requireEditable &&
      ['FINISHED', 'REVIEWED'].includes(result.work.status)
    ) {
      throw new ForbiddenException('Closed works cannot modify photos');
    }
  }

  private async authorizeJiraTicket(
    projectId: string,
    ticketId: string,
    user: AuthenticatedUser
  ): Promise<void> {
    await this.projectAccess.assertProjectAccess(projectId, user);
    await this.projectApi.findTicket(projectId, ticketId);
  }

  private assertUuid(value: string | undefined, field: string) {
    if (
      !value ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value
      )
    )
      throw new BadRequestException(`${field} must be a UUID`);
  }

  private parseMetadata(value?: string): Record<string, unknown> {
    try {
      const parsed = JSON.parse(value || '');
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object')
        throw new Error();
      return parsed;
    } catch {
      throw new BadRequestException('metadata must be valid JSON');
    }
  }

  private async json<T = unknown>(
    path: string,
    init?: RequestInit
  ): Promise<T> {
    const response = await this.request(path, init);
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  private async request(path: string, init?: RequestInit): Promise<Response> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, init);
    } catch {
      throw new ServiceUnavailableException('Files API is unavailable');
    }
    if (!response.ok) {
      const body = await response
        .json()
        .catch(() => ({ message: 'Files API error' }));
      throw new HttpException(
        body,
        [400, 401, 403, 404, 413].includes(response.status)
          ? response.status
          : 500
      );
    }
    return response;
  }
}
