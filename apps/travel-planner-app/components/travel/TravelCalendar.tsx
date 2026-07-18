'use client'

import { useState } from 'react'
import { useTravelStore } from '@/lib/use-travel-store'
import { Activity, CalendarView, Filters } from '@/lib/types'
import { ViewSwitcher } from './ViewSwitcher'
import { FiltersBar } from './FiltersBar'
import { MonthView } from './MonthView'
import { WeekView } from './WeekView'
import { DayView } from './DayView'
import { ItineraryList } from './ItineraryList'
import { ActivityFormModal } from './ActivityFormModal'
import { TravelDayModal } from './TravelDayModal'
import { TripSummary } from './TripSummary'
import {
  addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, format,
  startOfWeek, endOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

const EMPTY_FILTERS: Filters = { country: '', type: '', status: '', priority: '' }

function applyFilters(activities: Activity[], filters: Filters): Activity[] {
  return activities.filter(a => {
    if (filters.country && !a.countries.includes(filters.country)) return false
    if (filters.type && a.type !== filters.type) return false
    if (filters.status && a.status !== filters.status) return false
    if (filters.priority && a.priority !== filters.priority) return false
    return true
  })
}

function getNavLabel(date: Date, view: CalendarView): string {
  if (view === 'month') return format(date, 'MMMM yyyy', { locale: es })
  if (view === 'week') {
    const ws = startOfWeek(date, { weekStartsOn: 1 })
    const we = endOfWeek(date, { weekStartsOn: 1 })
    return `${format(ws, 'd MMM', { locale: es })} — ${format(we, 'd MMM yyyy', { locale: es })}`
  }
  return format(date, "EEEE d 'de' MMMM yyyy", { locale: es })
}

function navigate(date: Date, view: CalendarView, dir: 1 | -1): Date {
  if (view === 'month') return dir === 1 ? addMonths(date, 1) : subMonths(date, 1)
  if (view === 'week') return dir === 1 ? addWeeks(date, 1) : subWeeks(date, 1)
  return dir === 1 ? addDays(date, 1) : subDays(date, 1)
}

export function TravelCalendar() {
  const store = useTravelStore()
  const [view, setView] = useState<CalendarView>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [modalOpen, setModalOpen] = useState(false)
  const [editActivity, setEditActivity] = useState<Activity | null>(null)
  const [modalDate, setModalDate] = useState<string>('')
  const [travelDayModalOpen, setTravelDayModalOpen] = useState(false)
  const [travelDayModalDate, setTravelDayModalDate] = useState<string>('')

  const filteredActivities = applyFilters(store.activities, filters)

  function openNewActivity(date: string) {
    setEditActivity(null)
    setModalDate(date)
    setModalOpen(true)
  }

  function openEditActivity(activity: Activity) {
    setEditActivity(activity)
    setModalDate(activity.date)
    setModalOpen(true)
  }

  function handleSave(activity: Activity) {
    if (editActivity) {
      store.updateActivity(activity)
    } else {
      store.addActivity(activity)
    }
  }

  function handleSelectDay(date: string) {
    setCurrentDate(new Date(date + 'T12:00:00'))
    setView('day')
  }

  function openEditTravelDay(date: string) {
    setTravelDayModalDate(date)
    setTravelDayModalOpen(true)
  }

  if (!store.loaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground text-sm">
          {store.error ?? 'Cargando itinerario...'}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground leading-tight text-balance">Mi Viaje por Europa</h1>
              <p className="text-xs text-muted-foreground">Septiembre 2025</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => openNewActivity(format(currentDate, 'yyyy-MM-dd'))}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva actividad
            </button>
          </div>
        </div>

        {/* Trip summary */}
        <TripSummary activities={store.activities} />

        {/* Controls row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Navigation */}
          {view !== 'itinerary' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(d => navigate(d, view, -1))}
                className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-4 h-4 text-foreground" />
              </button>
              <span className="text-sm font-semibold text-foreground min-w-[160px] text-center capitalize">
                {getNavLabel(currentDate, view)}
              </span>
              <button
                onClick={() => setCurrentDate(d => navigate(d, view, 1))}
                className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                aria-label="Siguiente"
              >
                <ChevronRight className="w-4 h-4 text-foreground" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-colors"
              >
                Hoy
              </button>
            </div>
          )}
          <div className={cn(view === 'itinerary' && 'ml-auto')}>
            <ViewSwitcher current={view} onChange={setView} />
          </div>
        </div>

        {/* Filters */}
        <FiltersBar filters={filters} onChange={setFilters} />
      </header>

      {/* Main content */}
      <main>
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            activities={filteredActivities}
            travelDays={store.travelDays}
            onAddActivity={openNewActivity}
            onSelectDay={handleSelectDay}
            onEditActivity={openEditActivity}
            onEditTravelDay={openEditTravelDay}
          />
        )}
        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            activities={filteredActivities}
            travelDays={store.travelDays}
            onAddActivity={openNewActivity}
            onEditActivity={openEditActivity}
            onDeleteActivity={store.deleteActivity}
            onDuplicateActivity={store.duplicateActivity}
          />
        )}
        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            activities={filteredActivities}
            travelDays={store.travelDays}
            onAddActivity={openNewActivity}
            onEditActivity={openEditActivity}
            onDeleteActivity={store.deleteActivity}
            onDuplicateActivity={store.duplicateActivity}
          />
        )}
        {view === 'itinerary' && (
          <ItineraryList
            activities={filteredActivities}
            travelDays={store.travelDays}
            filters={filters}
            onAddActivity={openNewActivity}
            onEditActivity={openEditActivity}
            onDeleteActivity={store.deleteActivity}
            onDuplicateActivity={store.duplicateActivity}
          />
        )}
      </main>

      {/* Activity Modal */}
      <ActivityFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={store.deleteActivity}
        initialDate={modalDate}
        activity={editActivity}
      />

      {/* Travel Day Modal */}
      <TravelDayModal
        open={travelDayModalOpen}
        onClose={() => setTravelDayModalOpen(false)}
        onSave={store.upsertTravelDay}
        date={travelDayModalDate}
        travelDay={store.travelDays.find(d => d.date === travelDayModalDate)}
      />
    </div>
  )
}
