'use client'

import { useState, useEffect, useCallback } from 'react'
import { Activity, TravelDay, TravelStore } from './types'
import { getTrips, createTrip } from '@/services/tripService'
import {
  getActivities,
  createActivity,
  updateActivity as apiUpdateActivity,
  deleteActivity as apiDeleteActivity,
} from '@/services/activityService'
import {
  getTravelDays,
  upsertTravelDay as apiUpsertTravelDay,
} from '@/services/travelDayService'
import { clearToken } from './auth'

function syncTravelDay(activities: Activity[], date: string, travelDays: TravelDay[]): TravelDay[] {
  const dayActivities = activities.filter(a => a.date === date)
  const countries = [...new Set(dayActivities.flatMap(a => a.countries).filter(Boolean))]
  if (countries.length === 0) return travelDays
  const existing = travelDays.find(d => d.date === date)
  const updated: TravelDay = { date, countries, mainCity: existing?.mainCity, notes: existing?.notes }
  return existing
    ? travelDays.map(d => d.date === date ? updated : d)
    : [...travelDays, updated]
}

export function useTravelStore() {
  const [tripId, setTripId] = useState<string | null>(null)
  const [store, setStore] = useState<TravelStore>({ activities: [], travelDays: [] })
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      try {
        const trips = await getTrips()
        const trip = trips.length > 0
          ? trips[0]
          : await createTrip({ title: 'Mi Viaje' })

        setTripId(trip.id)

        const [activities, travelDays] = await Promise.all([
          getActivities(trip.id),
          getTravelDays(trip.id),
        ])
        setStore({ activities, travelDays })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : ''
        if (msg.includes('401')) {
          clearToken()
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.href)}`
          return
        }
        console.error('Error cargando viaje:', err)
        setError('No se pudo conectar con el servidor.')
      } finally {
        setLoaded(true)
      }
    }
    init()
  }, [])

  const addActivity = useCallback(async (activity: Activity) => {
    if (!tripId) return
    // Optimistic
    setStore(prev => {
      const newActivities = [...prev.activities, activity]
      return { activities: newActivities, travelDays: syncTravelDay(newActivities, activity.date, prev.travelDays) }
    })
    try {
      const { id: _tempId, ...data } = activity
      const saved = await createActivity(tripId, data)
      // Reemplazar el id temporal con el id real del servidor
      setStore(prev => ({
        ...prev,
        activities: prev.activities.map(a => a.id === activity.id ? saved : a),
      }))
    } catch (err) {
      console.error('Error creando actividad:', err)
      setStore(prev => ({ ...prev, activities: prev.activities.filter(a => a.id !== activity.id) }))
    }
  }, [tripId])

  const updateActivity = useCallback(async (updated: Activity) => {
    if (!tripId) return
    // Optimistic
    setStore(prev => {
      const oldActivity = prev.activities.find(a => a.id === updated.id)
      const newActivities = prev.activities.map(a => a.id === updated.id ? updated : a)
      let newTravelDays = syncTravelDay(newActivities, updated.date, prev.travelDays)
      if (oldActivity && oldActivity.date !== updated.date) {
        newTravelDays = syncTravelDay(newActivities, oldActivity.date, newTravelDays)
      }
      return { activities: newActivities, travelDays: newTravelDays }
    })
    try {
      const { id, ...data } = updated
      await apiUpdateActivity(tripId, id, data)
    } catch (err) {
      console.error('Error actualizando actividad:', err)
    }
  }, [tripId])

  const deleteActivity = useCallback(async (id: string) => {
    if (!tripId) return
    setStore(prev => {
      const activity = prev.activities.find(a => a.id === id)
      const newActivities = prev.activities.filter(a => a.id !== id)
      const newTravelDays = activity
        ? syncTravelDay(newActivities, activity.date, prev.travelDays)
        : prev.travelDays
      return { activities: newActivities, travelDays: newTravelDays }
    })
    try {
      await apiDeleteActivity(tripId, id)
    } catch (err) {
      console.error('Error eliminando actividad:', err)
    }
  }, [tripId])

  const duplicateActivity = useCallback(async (id: string) => {
    if (!tripId) return
    const original = store.activities.find(a => a.id === id)
    if (!original) return
    const copy: Activity = {
      ...original,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: `${original.title} (copia)`,
    }
    await addActivity(copy)
  }, [tripId, store.activities, addActivity])

  const upsertTravelDay = useCallback(async (day: TravelDay): Promise<{ ok: boolean; error?: string }> => {
    if (!tripId) return { ok: false, error: 'No hay viaje activo' }

    // Snapshot for rollback
    let snapshot: TravelDay[] = []

    // Optimistic update
    setStore(prev => {
      snapshot = prev.travelDays
      const exists = prev.travelDays.some(d => d.date === day.date)
      return {
        ...prev,
        travelDays: exists
          ? prev.travelDays.map(d => d.date === day.date ? day : d)
          : [...prev.travelDays, day],
      }
    })

    try {
      await apiUpsertTravelDay(tripId, day.date, day)
      return { ok: true }
    } catch (err) {
      console.error('Error guardando día:', err)
      // Rollback optimistic update
      setStore(prev => ({ ...prev, travelDays: snapshot }))
      const message = err instanceof Error ? err.message : 'Error al guardar el día'
      return { ok: false, error: message }
    }
  }, [tripId])

  const getActivitiesForDate = useCallback((date: string) => {
    return store.activities
      .filter(a => a.date === date)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
  }, [store.activities])

  const getTravelDay = useCallback((date: string): TravelDay | undefined => {
    return store.travelDays.find(d => d.date === date)
  }, [store.travelDays])

  return {
    tripId,
    activities: store.activities,
    travelDays: store.travelDays,
    loaded,
    error,
    addActivity,
    updateActivity,
    deleteActivity,
    duplicateActivity,
    upsertTravelDay,
    getActivitiesForDate,
    getTravelDay,
  }
}

