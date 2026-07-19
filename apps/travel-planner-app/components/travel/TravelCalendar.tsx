'use client';

import { useMemo, useState } from 'react';
import { useTravelStore } from '@/lib/use-travel-store';
import { Activity, CalendarView, Filters } from '@/lib/types';
import { ViewSwitcher } from './ViewSwitcher';
import { FiltersBar } from './FiltersBar';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { ItineraryList } from './ItineraryList';
import { ActivityFormModal } from './ActivityFormModal';
import { TravelDayModal } from './TravelDayModal';
import { TripSummary } from './TripSummary';
import { ShareTripModal } from './ShareTripModal';
import {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  LogOut,
  MapPin,
  Pencil,
  Plus,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { clearToken } from '@/lib/auth';

const EMPTY_FILTERS: Filters = {
  country: '',
  type: '',
  status: '',
  priority: '',
};

function applyFilters(activities: Activity[], filters: Filters): Activity[] {
  return activities.filter((a) => {
    if (filters.country && !a.countries.includes(filters.country)) return false;
    if (filters.type && a.type !== filters.type) return false;
    if (filters.status && a.status !== filters.status) return false;
    if (filters.priority && a.priority !== filters.priority) return false;
    return true;
  });
}

function getNavLabel(date: Date, view: CalendarView): string {
  if (view === 'month') return format(date, 'MMMM yyyy', { locale: es });
  if (view === 'week') {
    const ws = startOfWeek(date, { weekStartsOn: 1 });
    const we = endOfWeek(date, { weekStartsOn: 1 });
    return `${format(ws, 'd MMM', { locale: es })} — ${format(
      we,
      'd MMM yyyy',
      { locale: es }
    )}`;
  }
  return format(date, "EEEE d 'de' MMMM yyyy", { locale: es });
}

function navigate(date: Date, view: CalendarView, dir: 1 | -1): Date {
  if (view === 'month')
    return dir === 1 ? addMonths(date, 1) : subMonths(date, 1);
  if (view === 'week') return dir === 1 ? addWeeks(date, 1) : subWeeks(date, 1);
  return dir === 1 ? addDays(date, 1) : subDays(date, 1);
}

export function TravelCalendar() {
  const store = useTravelStore();
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [modalDate, setModalDate] = useState<string>('');
  const [travelDayModalOpen, setTravelDayModalOpen] = useState(false);
  const [travelDayModalDate, setTravelDayModalDate] = useState<string>('');
  const [shareOpen, setShareOpen] = useState(false);

  const access = useMemo(() => {
    if (!store.currentTrip || !store.currentUser) return 'viewer' as const;
    if (store.currentTrip.userId === store.currentUser.userId)
      return 'owner' as const;
    return (
      store.currentTrip.members?.find(
        (member) => member.userId === store.currentUser?.userId
      )?.role ?? 'viewer'
    );
  }, [store.currentTrip, store.currentUser]);

  const canEdit = access === 'owner' || access === 'editor';
  const isOwner = access === 'owner';

  const filteredActivities = applyFilters(store.activities, filters);

  function openNewActivity(date: string) {
    if (!canEdit) return;
    setEditActivity(null);
    setModalDate(date);
    setModalOpen(true);
  }

  function openEditActivity(activity: Activity) {
    if (!canEdit) return;
    setEditActivity(activity);
    setModalDate(activity.date);
    setModalOpen(true);
  }

  function handleSave(activity: Activity) {
    if (editActivity) {
      store.updateActivity(activity);
    } else {
      store.addActivity(activity);
    }
  }

  function handleSelectDay(date: string) {
    setCurrentDate(new Date(date + 'T12:00:00'));
    setView('day');
  }

  function openEditTravelDay(date: string) {
    if (!canEdit) return;
    setTravelDayModalDate(date);
    setTravelDayModalOpen(true);
  }

  if (!store.loaded || !store.currentTrip) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground text-sm">
          {store.error ?? 'Cargando itinerario...'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-5">
        <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 px-5 py-5 text-white shadow-xl shadow-blue-950/10 sm:px-7 sm:py-6">
          <div className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full border-[42px] border-white/[0.07]" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 size-56 rounded-full bg-cyan-300/15 blur-3xl" />

          <div className="relative flex flex-col gap-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <div className="flex size-8 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                  <MapPin className="size-4" />
                </div>
                <span>Travel Planner</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-semibold">
                    {store.currentUser?.name}
                  </p>
                  <p className="max-w-40 truncate text-[10px] text-white/60">
                    {store.currentUser?.email}
                  </p>
                </div>
                <div className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-white/15 text-xs font-bold backdrop-blur">
                  {store.currentUser?.name?.slice(0, 2).toUpperCase() || 'TU'}
                </div>
                <button
                  onClick={() => {
                    clearToken();
                    window.location.href = '/login';
                  }}
                  className="flex size-9 items-center justify-center rounded-xl text-white/70 transition hover:bg-white/15 hover:text-white"
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col items-start justify-between gap-5 lg:flex-row lg:items-end">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
                    {access === 'owner' ? (
                      <Sparkles className="size-3" />
                    ) : access === 'editor' ? (
                      <Pencil className="size-3" />
                    ) : (
                      <Eye className="size-3" />
                    )}
                    {access === 'owner'
                      ? 'Tu viaje'
                      : access === 'editor'
                      ? 'Puedes editar'
                      : 'Sólo lectura'}
                  </span>
                  {(store.currentTrip.members?.length ?? 0) > 0 && (
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-white/70">
                      <Users className="size-3" />
                      {(store.currentTrip.members?.length ?? 0) + 1} personas
                    </span>
                  )}
                </div>

                <div className="relative inline-flex max-w-full items-center">
                  <select
                    value={store.currentTrip.id}
                    onChange={(event) => store.selectTrip(event.target.value)}
                    disabled={store.switchingTrip}
                    className="max-w-full appearance-none bg-transparent py-0 pr-9 text-2xl font-bold tracking-tight text-white outline-none disabled:opacity-60 sm:text-3xl"
                    aria-label="Seleccionar viaje"
                  >
                    {store.trips.map((trip) => (
                      <option
                        key={trip.id}
                        value={trip.id}
                        className="text-foreground"
                      >
                        {trip.title}
                      </option>
                    ))}
                  </select>
                  {store.switchingTrip ? (
                    <Loader2 className="pointer-events-none absolute right-1 size-5 animate-spin text-white/70" />
                  ) : (
                    <ChevronDown className="pointer-events-none absolute right-1 size-5 text-white/70" />
                  )}
                </div>

                <div className="mt-2 flex items-center gap-2 text-sm text-white/65">
                  <CalendarDays className="size-4" />
                  <span>
                    {store.currentTrip.startDate && store.currentTrip.endDate
                      ? `${format(
                          parseISO(store.currentTrip.startDate),
                          'd MMM',
                          { locale: es }
                        )} — ${format(
                          parseISO(store.currentTrip.endDate),
                          'd MMM yyyy',
                          { locale: es }
                        )}`
                      : store.currentTrip.description ||
                        'Tu próxima aventura comienza aquí'}
                  </span>
                </div>
              </div>

              <div
                className={cn(
                  'grid w-full gap-2 sm:flex sm:w-auto',
                  canEdit ? 'grid-cols-2' : 'grid-cols-1'
                )}
              >
                <button
                  onClick={() => setShareOpen(true)}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20"
                >
                  <Share2 className="size-4" />
                  {isOwner ? 'Compartir' : 'Personas'}
                </button>
                {canEdit && (
                  <button
                    onClick={() =>
                      openNewActivity(format(currentDate, 'yyyy-MM-dd'))
                    }
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-blue-700 shadow-lg shadow-blue-950/15 transition hover:-translate-y-0.5 hover:bg-blue-50"
                  >
                    <Plus className="size-4" />
                    <span className="sm:hidden">Actividad</span>
                    <span className="hidden sm:inline">Nueva actividad</span>
                  </button>
                )}
              </div>
            </div>
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
                onClick={() => setCurrentDate((d) => navigate(d, view, -1))}
                className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-4 h-4 text-foreground" />
              </button>
              <span className="text-sm font-semibold text-foreground min-w-[160px] text-center capitalize">
                {getNavLabel(currentDate, view)}
              </span>
              <button
                onClick={() => setCurrentDate((d) => navigate(d, view, 1))}
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
            canEdit={canEdit}
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
            canEdit={canEdit}
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
            canEdit={canEdit}
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
            canEdit={canEdit}
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
        travelDay={store.travelDays.find((d) => d.date === travelDayModalDate)}
      />

      <ShareTripModal
        open={shareOpen}
        trip={store.currentTrip}
        ownerName={
          isOwner ? store.currentUser?.name || 'Tú' : 'Propietario del viaje'
        }
        canManage={isOwner}
        onClose={() => setShareOpen(false)}
        onMembersChange={store.updateMemberSnapshot}
      />
    </div>
  );
}
