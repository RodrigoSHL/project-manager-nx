'use client';

import { useState, useEffect, useCallback } from 'react';
import { Activity, TravelDay, TravelStore } from './types';
import { getTrips, createTrip, Trip } from '@/services/tripService';
import {
  getActivities,
  createActivity,
  updateActivity as apiUpdateActivity,
  deleteActivity as apiDeleteActivity,
} from '@/services/activityService';
import {
  getTravelDays,
  upsertTravelDay as apiUpsertTravelDay,
} from '@/services/travelDayService';
import { clearToken } from './auth';
import { getCurrentUser } from './auth';

function syncTravelDay(
  activities: Activity[],
  date: string,
  travelDays: TravelDay[]
): TravelDay[] {
  const dayActivities = activities.filter((a) => a.date === date);
  const countries = [
    ...new Set(dayActivities.flatMap((a) => a.countries).filter(Boolean)),
  ];
  if (countries.length === 0) return travelDays;
  const existing = travelDays.find((d) => d.date === date);
  const updated: TravelDay = {
    date,
    countries,
    mainCity: existing?.mainCity,
    notes: existing?.notes,
  };
  return existing
    ? travelDays.map((d) => (d.date === date ? updated : d))
    : [...travelDays, updated];
}

export function useTravelStore() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripId, setTripId] = useState<string | null>(null);
  const [store, setStore] = useState<TravelStore>({
    activities: [],
    travelDays: [],
  });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [switchingTrip, setSwitchingTrip] = useState(false);

  const loadTrip = useCallback(async (trip: Trip) => {
    setSwitchingTrip(true);
    setTripId(trip.id);
    setStore({ activities: [], travelDays: [] });
    try {
      const [activities, travelDays] = await Promise.all([
        getActivities(trip.id),
        getTravelDays(trip.id),
      ]);
      setStore({ activities, travelDays });
      setError(null);
    } finally {
      setSwitchingTrip(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const availableTrips = await getTrips();
        const trip =
          availableTrips.length > 0
            ? availableTrips[0]
            : await createTrip({ title: 'Mi Viaje' });
        setTrips(availableTrips.length > 0 ? availableTrips : [trip]);
        await loadTrip(trip);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('401')) {
          clearToken();
          window.location.href = `/login?redirect=${encodeURIComponent(
            window.location.href
          )}`;
          return;
        }
        console.error('Error cargando viaje:', err);
        setError('No se pudo conectar con el servidor.');
      } finally {
        setLoaded(true);
      }
    }
    init();
  }, [loadTrip]);

  const selectTrip = useCallback(
    async (nextTripId: string) => {
      const trip = trips.find((item) => item.id === nextTripId);
      if (!trip || trip.id === tripId) return;
      try {
        await loadTrip(trip);
      } catch (err) {
        console.error('Error cambiando de viaje:', err);
        setError('No se pudo cargar el viaje seleccionado.');
      }
    },
    [loadTrip, tripId, trips]
  );

  const updateMemberSnapshot = useCallback(
    (members: Trip['members']) => {
      if (!tripId) return;
      setTrips((current) =>
        current.map((trip) =>
          trip.id === tripId ? { ...trip, members } : trip
        )
      );
    },
    [tripId]
  );

  const addActivity = useCallback(
    async (activity: Activity): Promise<Activity> => {
      if (!tripId) throw new Error('No hay un viaje activo');
      // Optimistic
      setStore((prev) => {
        const newActivities = [...prev.activities, activity];
        return {
          activities: newActivities,
          travelDays: syncTravelDay(
            newActivities,
            activity.date,
            prev.travelDays
          ),
        };
      });
      try {
        const data = { ...activity };
        delete (data as Partial<Activity>).id;
        const saved = await createActivity(tripId, data);
        // Reemplazar el id temporal con el id real del servidor
        setStore((prev) => ({
          ...prev,
          activities: prev.activities.map((a) =>
            a.id === activity.id ? saved : a
          ),
        }));
        return saved;
      } catch (err) {
        console.error('Error creando actividad:', err);
        setStore((prev) => ({
          ...prev,
          activities: prev.activities.filter((a) => a.id !== activity.id),
        }));
        throw err;
      }
    },
    [tripId]
  );

  const updateActivity = useCallback(
    async (updated: Activity): Promise<Activity> => {
      if (!tripId) throw new Error('No hay un viaje activo');
      const previous = store.activities.find((activity) => activity.id === updated.id);
      // Optimistic
      setStore((prev) => {
        const oldActivity = prev.activities.find((a) => a.id === updated.id);
        const newActivities = prev.activities.map((a) =>
          a.id === updated.id ? updated : a
        );
        let newTravelDays = syncTravelDay(
          newActivities,
          updated.date,
          prev.travelDays
        );
        if (oldActivity && oldActivity.date !== updated.date) {
          newTravelDays = syncTravelDay(
            newActivities,
            oldActivity.date,
            newTravelDays
          );
        }
        return { activities: newActivities, travelDays: newTravelDays };
      });
      try {
        const { id, ...data } = updated;
        const saved = await apiUpdateActivity(tripId, id, data);
        setStore((prev) => ({ ...prev, activities: prev.activities.map((activity) => activity.id === id ? saved : activity) }));
        return saved;
      } catch (err) {
        console.error('Error actualizando actividad:', err);
        if (previous) setStore((prev) => ({ ...prev, activities: prev.activities.map((activity) => activity.id === previous.id ? previous : activity) }));
        throw err;
      }
    },
    [tripId, store.activities]
  );

  const deleteActivity = useCallback(
    async (id: string) => {
      if (!tripId) return;
      try {
        await apiDeleteActivity(tripId, id);
        setStore((prev) => {
          const activity = prev.activities.find((a) => a.id === id);
          const newActivities = prev.activities.filter((a) => a.id !== id);
          const newTravelDays = activity
            ? syncTravelDay(newActivities, activity.date, prev.travelDays)
            : prev.travelDays;
          return { activities: newActivities, travelDays: newTravelDays };
        });
        setError(null);
      } catch (err) {
        console.error('Error eliminando actividad:', err);
        const message =
          err instanceof Error
            ? err.message
            : 'No se pudo eliminar la actividad.';
        setError(message);
        throw err;
      }
    },
    [tripId]
  );

  const duplicateActivity = useCallback(
    async (id: string) => {
      if (!tripId) return;
      const original = store.activities.find((a) => a.id === id);
      if (!original) return;
      const copy: Activity = {
        ...original,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: `${original.title} (copia)`,
      };
      await addActivity(copy);
    },
    [tripId, store.activities, addActivity]
  );

  const upsertTravelDay = useCallback(
    async (day: TravelDay): Promise<{ ok: boolean; error?: string }> => {
      if (!tripId) return { ok: false, error: 'No hay viaje activo' };

      // Snapshot for rollback
      let snapshot: TravelDay[] = [];

      // Optimistic update
      setStore((prev) => {
        snapshot = prev.travelDays;
        const exists = prev.travelDays.some((d) => d.date === day.date);
        return {
          ...prev,
          travelDays: exists
            ? prev.travelDays.map((d) => (d.date === day.date ? day : d))
            : [...prev.travelDays, day],
        };
      });

      try {
        await apiUpsertTravelDay(tripId, day.date, day);
        return { ok: true };
      } catch (err) {
        console.error('Error guardando día:', err);
        // Rollback optimistic update
        setStore((prev) => ({ ...prev, travelDays: snapshot }));
        const message =
          err instanceof Error ? err.message : 'Error al guardar el día';
        return { ok: false, error: message };
      }
    },
    [tripId]
  );

  const getActivitiesForDate = useCallback(
    (date: string) => {
      return store.activities
        .filter((a) => a.date === date)
        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    },
    [store.activities]
  );

  const getTravelDay = useCallback(
    (date: string): TravelDay | undefined => {
      return store.travelDays.find((d) => d.date === date);
    },
    [store.travelDays]
  );

  return {
    trips,
    tripId,
    currentTrip: trips.find((trip) => trip.id === tripId) ?? null,
    activities: store.activities,
    travelDays: store.travelDays,
    loaded,
    error,
    switchingTrip,
    currentUser: getCurrentUser(),
    selectTrip,
    updateMemberSnapshot,
    addActivity,
    updateActivity,
    deleteActivity,
    duplicateActivity,
    upsertTravelDay,
    getActivitiesForDate,
    getTravelDay,
  };
}
