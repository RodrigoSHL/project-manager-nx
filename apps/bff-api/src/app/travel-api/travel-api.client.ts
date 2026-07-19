import {
  Injectable,
  ServiceUnavailableException,
  HttpException,
} from '@nestjs/common';
import { AuthenticatedUser } from '../auth/types/authenticated-user';

type Body = Record<string, unknown>;

@Injectable()
export class TravelApiClient {
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

  deleteActivity(tripId: string, activityId: string, user: AuthenticatedUser) {
    return this.authedDelete(`/trips/${tripId}/activities/${activityId}`, user);
  }

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
