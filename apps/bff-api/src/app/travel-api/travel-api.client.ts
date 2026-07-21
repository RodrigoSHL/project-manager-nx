import {
  Injectable,
  ServiceUnavailableException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/types/authenticated-user';

type Body = Record<string, unknown>;

@Injectable()
export class TravelApiClient {
  private readonly logger = new Logger(TravelApiClient.name);
  private readonly baseUrl = this.resolveBaseUrl();

  // ── Trips ─────────────────────────────────────────────────────────────────

  listTrips(user: AuthenticatedUser) {
    return this.authedGet('/trips', user);
  }

  getTrip(tripId: string, user: AuthenticatedUser) {
    return this.authedGet(`/trips/${tripId}`, user);
  }

  createTrip(dto: Body, user: AuthenticatedUser) {
    return this.authedPost('/trips', dto, user);
  }

  updateTrip(tripId: string, dto: Body, user: AuthenticatedUser) {
    return this.authedPatch(`/trips/${tripId}`, dto, user);
  }

  deleteTrip(tripId: string, user: AuthenticatedUser) {
    return this.authedDelete(`/trips/${tripId}`, user);
  }

  travelerGet(path: string, user: AuthenticatedUser) { return this.authedGet(`/traveler-profile${path}`, user); }
  travelerPost(path: string, dto: Body, user: AuthenticatedUser) { return this.authedPost(`/traveler-profile${path}`, dto, user); }
  travelerPatch(path: string, dto: Body, user: AuthenticatedUser) { return this.authedPatch(`/traveler-profile${path}`, dto, user); }
  travelerDelete(path: string, user: AuthenticatedUser) { return this.authedDelete(`/traveler-profile${path}`, user); }

  // ── Personal luggage ─────────────────────────────────────────────────────

  listLuggage(user: AuthenticatedUser) {
    return this.authedGet('/luggage', user);
  }

  createLuggage(dto: Body, user: AuthenticatedUser) {
    return this.authedPost('/luggage', dto, user);
  }

  updateLuggage(id: string, dto: Body, user: AuthenticatedUser) {
    return this.authedPatch(`/luggage/${id}`, dto, user);
  }

  duplicateLuggage(id: string, user: AuthenticatedUser) {
    return this.authedPost(`/luggage/${id}/duplicate`, {}, user);
  }

  archiveLuggage(id: string, user: AuthenticatedUser) {
    return this.authedPost(`/luggage/${id}/archive`, {}, user);
  }

  // ── Trip luggage and packing ─────────────────────────────────────────────

  listTripLuggage(tripId: string, user: AuthenticatedUser) {
    return this.authedGet(`/trips/${tripId}/luggage`, user);
  }

  addTripLuggage(tripId: string, dto: Body, user: AuthenticatedUser) {
    return this.authedPost(`/trips/${tripId}/luggage`, dto, user);
  }

  updateTripLuggage(tripId: string, id: string, dto: Body, user: AuthenticatedUser) {
    return this.authedPatch(`/trips/${tripId}/luggage/${id}`, dto, user);
  }

  removeTripLuggage(tripId: string, id: string, user: AuthenticatedUser) {
    return this.authedDelete(`/trips/${tripId}/luggage/${id}`, user);
  }

  listPackingItems(tripId: string, user: AuthenticatedUser) {
    return this.authedGet(`/trips/${tripId}/packing`, user);
  }

  packingDashboard(tripId: string, user: AuthenticatedUser) {
    return this.authedGet(`/trips/${tripId}/packing/dashboard`, user);
  }

  generatePackingList(tripId: string, dto: Body, user: AuthenticatedUser) {
    return this.authedPost(`/trips/${tripId}/packing/generate`, dto, user);
  }

  createPackingItem(tripId: string, dto: Body, user: AuthenticatedUser) {
    return this.authedPost(`/trips/${tripId}/packing/items`, dto, user);
  }

  updatePackingItem(tripId: string, id: string, dto: Body, user: AuthenticatedUser) {
    return this.authedPatch(`/trips/${tripId}/packing/items/${id}`, dto, user);
  }

  removePackingItem(tripId: string, id: string, user: AuthenticatedUser) {
    return this.authedDelete(`/trips/${tripId}/packing/items/${id}`, user);
  }

  // ── Sharing ───────────────────────────────────────────────────────────────

  listMembers(tripId: string, user: AuthenticatedUser) {
    return this.authedGet(`/trips/${tripId}/members`, user);
  }

  addMember(tripId: string, dto: Body, user: AuthenticatedUser) {
    return this.authedPost(`/trips/${tripId}/members`, dto, user);
  }

  updateMember(
    tripId: string,
    userId: string,
    dto: Body,
    user: AuthenticatedUser
  ) {
    return this.authedPatch(`/trips/${tripId}/members/${userId}`, dto, user);
  }

  removeMember(tripId: string, userId: string, user: AuthenticatedUser) {
    return this.authedDelete(`/trips/${tripId}/members/${userId}`, user);
  }

  // ── Activities ────────────────────────────────────────────────────────────

  listActivities(tripId: string, user: AuthenticatedUser) {
    return this.authedGet(`/trips/${tripId}/activities`, user);
  }

  getActivity(tripId: string, activityId: string, user: AuthenticatedUser) {
    return this.authedGet(`/trips/${tripId}/activities/${activityId}`, user);
  }

  createActivity(tripId: string, dto: Body, user: AuthenticatedUser) {
    return this.authedPost(`/trips/${tripId}/activities`, dto, user);
  }

  updateActivity(
    tripId: string,
    activityId: string,
    dto: Body,
    user: AuthenticatedUser
  ) {
    return this.authedPatch(
      `/trips/${tripId}/activities/${activityId}`,
      dto,
      user
    );
  }

  async deleteActivity(tripId: string, activityId: string, user: AuthenticatedUser) {
    const filesUrl = (process.env.FILES_API_URL || 'http://localhost:3004/api').replace(/\/$/, '');
    let photos: Array<{ id: string }> = [];
    try {
      const response = await fetch(`${filesUrl}/files?application=travel-planner-app&ownerType=activity&ownerId=${encodeURIComponent(activityId)}`);
      if (response.ok) photos = await response.json() as Array<{ id: string }>;
    } catch {
      // Deleting the domain object remains authoritative if storage is unavailable.
    }
    await this.authedDelete(`/trips/${tripId}/activities/${activityId}`, user);
    const cleanup = await Promise.allSettled(photos.map(async (photo) => {
      const response = await fetch(`${filesUrl}/files/${photo.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`files-api returned ${response.status}`);
    }));
    const failures = cleanup.filter((result) => result.status === 'rejected').length;
    if (failures) this.logger.error(`Activity ${activityId} was deleted, but ${failures} photo(s) require cleanup retry`);
  }

  // ── Finance ──────────────────────────────────────────────────────────────
  financeGet(tripId: string, path: string, user: AuthenticatedUser, query?: Record<string, unknown>) {
    const params = new URLSearchParams(); Object.entries(query ?? {}).forEach(([key,value]) => { if (value !== undefined && value !== '') params.set(key, String(value)); });
    return this.authedGet(`/trips/${tripId}/finance/${path}${params.size ? `?${params}` : ''}`, user);
  }
  financePost(tripId:string,path:string,dto:Body,user:AuthenticatedUser){ return this.authedPost(`/trips/${tripId}/finance/${path}`,dto,user); }
  financePut(tripId:string,path:string,dto:Body,user:AuthenticatedUser){ return this.authedPut(`/trips/${tripId}/finance/${path}`,dto,user); }
  financePatch(tripId:string,path:string,dto:Body,user:AuthenticatedUser){ return this.authedPatch(`/trips/${tripId}/finance/${path}`,dto,user); }
  financeDelete(tripId:string,path:string,user:AuthenticatedUser){ return this.authedDelete(`/trips/${tripId}/finance/${path}`,user); }

  // ── Travel Days ───────────────────────────────────────────────────────────

  listDays(tripId: string, user: AuthenticatedUser) {
    return this.authedGet(`/trips/${tripId}/days`, user);
  }

  upsertDay(tripId: string, date: string, dto: Body, user: AuthenticatedUser) {
    return this.authedPut(`/trips/${tripId}/days/${date}`, dto, user);
  }

  deleteDay(tripId: string, date: string, user: AuthenticatedUser) {
    return this.authedDelete(`/trips/${tripId}/days/${date}`, user);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async authedGet(path: string, user: AuthenticatedUser) {
    return this.send(path, { method: 'GET', headers: this.userHeaders(user) });
  }

  private async authedPost(path: string, body: Body, user: AuthenticatedUser) {
    return this.send(path, {
      method: 'POST',
      headers: {
        ...this.userHeaders(user),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  private async authedPatch(path: string, body: Body, user: AuthenticatedUser) {
    return this.send(path, {
      method: 'PATCH',
      headers: {
        ...this.userHeaders(user),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  private async authedPut(path: string, body: Body, user: AuthenticatedUser) {
    return this.send(path, {
      method: 'PUT',
      headers: {
        ...this.userHeaders(user),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  private async authedDelete(path: string, user: AuthenticatedUser) {
    const res = await this.fetch(path, {
      method: 'DELETE',
      headers: this.userHeaders(user),
    });
    if (!res.ok) {
      const body = await res
        .json()
        .catch(() => ({ message: 'Upstream error' }));
      throw new HttpException(body, res.status);
    }
    return undefined;
  }

  private async send(path: string, init: RequestInit) {
    const res = await this.fetch(path, init);
    if (!res.ok) {
      const body = await res
        .json()
        .catch(() => ({ message: 'Upstream error' }));
      throw new HttpException(body, res.status);
    }
    if (res.status === 204) return undefined;
    return res.json();
  }

  private async fetch(path: string, init: RequestInit): Promise<Response> {
    try {
      return await globalThis.fetch(`${this.baseUrl}${path}`, init);
    } catch {
      throw new ServiceUnavailableException(
        'Travel Planner API is unavailable'
      );
    }
  }

  private userHeaders(user: AuthenticatedUser): Record<string, string> {
    return {
      'x-user-id': user.userId,
      'x-user-email': user.email,
      'x-user-roles': user.roles.join(','),
    };
  }

  private resolveBaseUrl(): string {
    const url = (
      process.env.TRAVEL_API_URL || 'http://localhost:3003/api'
    ).replace(/\/$/, '');
    return url.endsWith('/api') ? url : `${url}/api`;
  }
}
