'use client'

import { useState, useEffect, useCallback } from 'react'
import { Activity, TravelDay, TravelStore } from './types'
import { SAMPLE_ACTIVITIES, SAMPLE_TRAVEL_DAYS } from './sample-data'

const STORAGE_KEY = 'travel-planner-data'

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

function loadFromStorage(): TravelStore {
  if (typeof window === 'undefined') {
    return { activities: SAMPLE_ACTIVITIES, travelDays: SAMPLE_TRAVEL_DAYS }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { activities: SAMPLE_ACTIVITIES, travelDays: SAMPLE_TRAVEL_DAYS }
    return JSON.parse(raw)
  } catch {
    return { activities: SAMPLE_ACTIVITIES, travelDays: SAMPLE_TRAVEL_DAYS }
  }
}

function saveToStorage(store: TravelStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // ignore
  }
}

export function useTravelStore() {
  const [store, setStore] = useState<TravelStore>({ activities: [], travelDays: [] })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setStore(loadFromStorage())
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) saveToStorage(store)
  }, [store, loaded])

  const addActivity = useCallback((activity: Activity) => {
    setStore(prev => {
      const newActivities = [...prev.activities, activity]
      const newTravelDays = syncTravelDay(newActivities, activity.date, prev.travelDays)
      return { activities: newActivities, travelDays: newTravelDays }
    })
  }, [])

  const updateActivity = useCallback((updated: Activity) => {
    setStore(prev => {
      const oldActivity = prev.activities.find(a => a.id === updated.id)
      const newActivities = prev.activities.map(a => a.id === updated.id ? updated : a)
      let newTravelDays = syncTravelDay(newActivities, updated.date, prev.travelDays)
      if (oldActivity && oldActivity.date !== updated.date) {
        newTravelDays = syncTravelDay(newActivities, oldActivity.date, newTravelDays)
      }
      return { activities: newActivities, travelDays: newTravelDays }
    })
  }, [])

  const deleteActivity = useCallback((id: string) => {
    setStore(prev => {
      const activity = prev.activities.find(a => a.id === id)
      const newActivities = prev.activities.filter(a => a.id !== id)
      const newTravelDays = activity
        ? syncTravelDay(newActivities, activity.date, prev.travelDays)
        : prev.travelDays
      return { activities: newActivities, travelDays: newTravelDays }
    })
  }, [])

  const duplicateActivity = useCallback((id: string) => {
    setStore(prev => {
      const original = prev.activities.find(a => a.id === id)
      if (!original) return prev
      const copy: Activity = {
        ...original,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: `${original.title} (copia)`,
      }
      return { ...prev, activities: [...prev.activities, copy] }
    })
  }, [])

  const upsertTravelDay = useCallback((day: TravelDay) => {
    setStore(prev => {
      const exists = prev.travelDays.some(d => d.date === day.date)
      return {
        ...prev,
        travelDays: exists
          ? prev.travelDays.map(d => d.date === day.date ? day : d)
          : [...prev.travelDays, day],
      }
    })
  }, [])

  const getActivitiesForDate = useCallback((date: string) => {
    return store.activities
      .filter(a => a.date === date)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
  }, [store.activities])

  const getTravelDay = useCallback((date: string): TravelDay | undefined => {
    return store.travelDays.find(d => d.date === date)
  }, [store.travelDays])

  const resetToSampleData = useCallback(() => {
    const fresh = { activities: SAMPLE_ACTIVITIES, travelDays: SAMPLE_TRAVEL_DAYS }
    setStore(fresh)
    saveToStorage(fresh)
  }, [])

  return {
    activities: store.activities,
    travelDays: store.travelDays,
    loaded,
    addActivity,
    updateActivity,
    deleteActivity,
    duplicateActivity,
    upsertTravelDay,
    getActivitiesForDate,
    getTravelDay,
    resetToSampleData,
  }
}
