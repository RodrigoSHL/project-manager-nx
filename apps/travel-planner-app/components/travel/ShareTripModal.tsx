'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getTripMembers,
  getUserProfile,
  removeTripMember,
  shareTrip,
  Trip,
  TripMember,
  TripMemberRole,
  updateTripMember,
  UserProfile,
} from '@/services/tripService';
import {
  Check,
  Eye,
  Loader2,
  Mail,
  Pencil,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemberWithProfile extends TripMember {
  profile?: UserProfile;
}

interface Props {
  open: boolean;
  trip: Trip;
  ownerName: string;
  canManage: boolean;
  onClose: () => void;
  onMembersChange: (members: TripMember[]) => void;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function ShareTripModal({
  open,
  trip,
  ownerName,
  canManage,
  onClose,
  onMembersChange,
}: Props) {
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [resolvedOwnerName, setResolvedOwnerName] = useState(ownerName);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TripMemberRole>('editor');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function loadMembers() {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const [result, ownerProfile] = await Promise.all([
          getTripMembers(trip.id),
          getUserProfile(trip.userId).catch(() => null),
        ]);
        const enriched = await Promise.all(
          result.map(async (member) => {
            try {
              return {
                ...member,
                profile: await getUserProfile(member.userId),
              };
            } catch {
              return member;
            }
          })
        );
        if (!cancelled) {
          setMembers(enriched);
          setResolvedOwnerName(ownerProfile?.name || ownerName);
        }
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error
              ? err.message
              : 'No pudimos cargar las personas.'
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMembers();
    return () => {
      cancelled = true;
    };
  }, [open, ownerName, trip.id, trip.userId]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose, open]);

  const peopleCount = useMemo(() => members.length + 1, [members.length]);

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const member = await shareTrip(trip.id, email.trim(), role);
      let profile: UserProfile | undefined;
      try {
        profile = await getUserProfile(member.userId);
      } catch {
        profile = undefined;
      }
      const nextMembers = [...members, { ...member, profile }];
      setMembers(nextMembers);
      onMembersChange(nextMembers);
      setEmail('');
      setSuccess(
        `Invitación agregada para ${profile?.name || 'el nuevo colaborador'}.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No pudimos compartir el viaje.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoleChange(
    member: MemberWithProfile,
    nextRole: TripMemberRole
  ) {
    setBusyUserId(member.userId);
    setError(null);
    try {
      const updated = await updateTripMember(trip.id, member.userId, nextRole);
      const nextMembers = members.map((item) =>
        item.userId === member.userId ? { ...item, ...updated } : item
      );
      setMembers(nextMembers);
      onMembersChange(nextMembers);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No pudimos cambiar el permiso.'
      );
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleRemove(member: MemberWithProfile) {
    setBusyUserId(member.userId);
    setError(null);
    try {
      await removeTripMember(trip.id, member.userId);
      const nextMembers = members.filter(
        (item) => item.userId !== member.userId
      );
      setMembers(nextMembers);
      onMembersChange(nextMembers);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No pudimos quitar a esta persona.'
      );
    } finally {
      setBusyUserId(null);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-trip-title"
    >
      <button
        className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <section className="relative z-10 flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[28px] border border-white/60 bg-card shadow-2xl sm:max-w-2xl sm:rounded-[28px]">
        <div className="relative overflow-hidden border-b border-border/70 bg-gradient-to-br from-sky-50 via-white to-amber-50 px-5 pb-5 pt-6 sm:px-7 sm:pb-6">
          <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-sky-200/35 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Users className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  Viaje compartido
                </p>
                <h2
                  id="share-trip-title"
                  className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl"
                >
                  {trip.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {peopleCount}{' '}
                  {peopleCount === 1 ? 'persona tiene' : 'personas tienen'}{' '}
                  acceso
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-white/80 text-muted-foreground shadow-sm transition hover:bg-white hover:text-foreground"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto overscroll-contain">
          {canManage && (
            <form
              onSubmit={handleInvite}
              className="border-b border-border/70 p-5 sm:p-7"
            >
              <div className="mb-3 flex items-center gap-2">
                <UserPlus className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">Invitar a alguien</h3>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_140px_auto]">
                <label className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="persona@email.com"
                    className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-sm shadow-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                  />
                </label>
                <select
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value as TripMemberRole)
                  }
                  className="h-11 rounded-xl border border-input bg-background px-3 text-sm font-medium shadow-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                  aria-label="Permiso"
                >
                  <option value="editor">Puede editar</option>
                  <option value="viewer">Sólo lectura</option>
                </select>
                <button
                  type="submit"
                  disabled={submitting || !email.trim()}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UserPlus className="size-4" />
                  )}
                  Invitar
                </button>
              </div>

              {(error || success) && (
                <div
                  className={cn(
                    'mt-3 flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm',
                    error
                      ? 'border-red-200 bg-red-50 text-red-700'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  )}
                >
                  {error ? (
                    <X className="mt-0.5 size-4 shrink-0" />
                  ) : (
                    <Check className="mt-0.5 size-4 shrink-0" />
                  )}
                  <span>{error || success}</span>
                </div>
              )}
            </form>
          )}

          <div className="p-5 sm:p-7">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Personas con acceso</h3>
              {!canManage && (
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                  Sólo consulta
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary/[0.035] p-3.5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-sky-400 text-xs font-bold text-white shadow-sm">
                  {initials(resolvedOwnerName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {resolvedOwnerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Propietario del viaje
                  </p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                  <ShieldCheck className="size-3.5" />
                  Propietario
                </span>
              </div>

              {loading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Cargando personas…
                </div>
              ) : members.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-5 py-9 text-center">
                  <Users className="mx-auto mb-2 size-6 text-muted-foreground/60" />
                  <p className="text-sm font-medium">
                    Aún no hay colaboradores
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Invita a alguien para planificar juntos.
                  </p>
                </div>
              ) : (
                members.map((member) => {
                  const displayName = member.profile?.name || 'Usuario';
                  const isBusy = busyUserId === member.userId;
                  return (
                    <div
                      key={member.id}
                      className="group flex flex-wrap items-center gap-3 rounded-2xl border border-transparent p-3 transition hover:border-border hover:bg-muted/40"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-200 to-orange-300 text-xs font-bold text-amber-950">
                        {member.profile?.avatarUrl ? (
                          <img
                            src={member.profile.avatarUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          initials(displayName)
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {displayName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {member.profile?.email || member.userId}
                        </p>
                      </div>

                      {canManage ? (
                        <div className="ml-[52px] flex w-full items-center justify-end gap-1.5 sm:ml-0 sm:w-auto">
                          <label className="relative">
                            {member.role === 'editor' ? (
                              <Pencil className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            ) : (
                              <Eye className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            )}
                            <select
                              value={member.role}
                              disabled={isBusy}
                              onChange={(event) =>
                                handleRoleChange(
                                  member,
                                  event.target.value as TripMemberRole
                                )
                              }
                              className="h-9 rounded-xl border border-input bg-background pl-8 pr-7 text-xs font-medium outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-50"
                              aria-label={`Permiso de ${displayName}`}
                            >
                              <option value="editor">Puede editar</option>
                              <option value="viewer">Sólo lectura</option>
                            </select>
                          </label>
                          <button
                            onClick={() => handleRemove(member)}
                            disabled={isBusy}
                            className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            aria-label={`Quitar a ${displayName}`}
                          >
                            {isBusy ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                          {member.role === 'editor' ? (
                            <Pencil className="size-3" />
                          ) : (
                            <Eye className="size-3" />
                          )}
                          {member.role === 'editor' ? 'Editor' : 'Lectura'}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
