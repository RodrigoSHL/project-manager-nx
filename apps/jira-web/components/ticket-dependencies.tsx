'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  GitBranch,
  Plus,
  Unlink,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { statusConfig } from '@/lib/mock-data'
import { buildTicketPageHref } from '@/lib/ticket-link'
import { cn } from '@/lib/utils'
import {
  addTicketDependency,
  getTicketDependencies,
  removeTicketDependency,
  type DependencyTicket,
  type TicketDependencies as Dependencies,
} from '@/services/ticketService'
import type { ApiTicket } from '@/types/project'

const byKey = (a: DependencyTicket, b: DependencyTicket) =>
  a.key.localeCompare(b.key, 'es', { numeric: true })

export function TicketDependencies({
  ticket,
  tickets,
  canWrite,
  onSelect,
}: {
  ticket: ApiTicket
  tickets: ApiTicket[]
  canWrite: boolean
  onSelect: (ticket: ApiTicket) => void
}) {
  const { id, projectId, key } = ticket
  const [dependencies, setDependencies] = useState<Dependencies>()
  const [loadError, setLoadError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [removeError, setRemoveError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    void getTicketDependencies(projectId, id, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setDependencies(result)
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true)
      })
    return () => controller.abort()
  }, [projectId, id, attempt])

  const linkedIds = new Set(dependencies?.dependsOn.map((item) => item.id))
  const candidates = tickets
    .filter(
      (item) =>
        item.projectId === projectId &&
        item.id !== id &&
        !linkedIds.has(item.id)
    )
    .sort(byKey)
  const query = search.trim().toLocaleLowerCase()
  const matches = candidates.filter((item) =>
    `${item.key} ${item.title}`.toLocaleLowerCase().includes(query)
  )

  function changeOpen(next: boolean) {
    if (busy) return
    setOpen(next)
    setSearch('')
    setSelected(undefined)
    setSaveError('')
  }

  async function add() {
    if (!canWrite || !selected || busy) return
    setBusy(true)
    setSaveError('')
    try {
      setDependencies(await addTicketDependency(projectId, id, selected))
      setOpen(false)
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'No se pudo agregar la dependencia.'
      )
    } finally {
      setBusy(false)
    }
  }

  async function remove(prerequisiteId: string) {
    if (!canWrite || busy) return
    setBusy(true)
    setRemoveError('')
    try {
      await removeTicketDependency(projectId, id, prerequisiteId)
      setDependencies(
        (current) =>
          current && {
            ...current,
            dependsOn: current.dependsOn.filter(
              (item) => item.id !== prerequisiteId
            ),
          }
      )
    } catch (error) {
      setRemoveError(
        error instanceof Error
          ? error.message
          : 'No se pudo quitar la dependencia.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <section
        aria-label="Dependencias"
        className="mb-6 space-y-3 rounded-xl border bg-card p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <GitBranch aria-hidden className="size-4 text-brand-foreground" />
            Dependencias
          </h3>
          {canWrite && (
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                disabled={!dependencies || busy}
              >
                <Plus aria-hidden className="size-4" /> Agregar dependencia
              </Button>
            </DialogTrigger>
          )}
        </div>
        {loadError && (
          <div className="flex flex-wrap items-center gap-2">
            <p role="alert" className="text-sm text-destructive">
              No se pudieron cargar las dependencias.
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setLoadError(false)
                setAttempt((value) => value + 1)
              }}
            >
              Reintentar
            </Button>
          </div>
        )}
        {!dependencies && !loadError && (
          <p role="status" className="text-sm text-muted-foreground">
            Cargando dependencias…
          </p>
        )}
        {dependencies && (
          <div className="space-y-3">
            {[
              {
                label: 'Depende de',
                items: dependencies.dependsOn,
                Icon: ArrowDownRight,
                removable: canWrite,
              },
              {
                label: 'Bloquea a',
                items: dependencies.blocks,
                Icon: ArrowUpRight,
                removable: false,
              },
            ]
              .filter((group) => group.items.length)
              .map(({ label, items, Icon, removable }) => (
                <div key={label} className="space-y-1.5">
                  <h4 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Icon aria-hidden className="size-3.5" /> {label}
                  </h4>
                  <ul aria-label={label} className="space-y-1.5">
                    {[...items].sort(byKey).map((item) => {
                      const target = tickets.find(
                        (candidate) =>
                          candidate.id === item.id &&
                          candidate.projectId === projectId
                      )
                      const currentStatus = target?.status ?? item.status
                      const status =
                        currentStatus === 'cancelled'
                          ? 'Cancelado'
                          : statusConfig[currentStatus].label
                      const labelContent = (
                        <>
                          <span className="shrink-0 font-mono text-xs text-brand-foreground">
                            {item.key}
                          </span>
                          <span
                            className="min-w-0 flex-1 truncate"
                            title={target?.title ?? item.title}
                          >
                            {target?.title ?? item.title}
                          </span>
                          <Badge
                            variant="secondary"
                            className="hidden shrink-0 text-[10px] sm:inline-flex"
                          >
                            {status}
                          </Badge>
                        </>
                      )
                      const rowClass =
                        'flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring'
                      return (
                        <li
                          key={item.id}
                          className="flex items-center gap-1 rounded-lg bg-muted/35 pr-1"
                        >
                          {target ? (
                            <button
                              type="button"
                              className={rowClass}
                              onClick={() => onSelect(target)}
                            >
                              {labelContent}
                            </button>
                          ) : (
                            <Link
                              className={rowClass}
                              href={buildTicketPageHref(projectId, item.id)}
                            >
                              {labelContent}
                            </Link>
                          )}
                          {removable && (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="size-8 shrink-0"
                              disabled={busy}
                              aria-label={`Quitar dependencia con ${item.key}`}
                              title="Quitar dependencia"
                              onClick={() => void remove(item.id)}
                            >
                              <Unlink aria-hidden className="size-4" />
                            </Button>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            {!dependencies.dependsOn.length && !dependencies.blocks.length && (
              <p className="text-sm text-muted-foreground">
                Este ticket no tiene dependencias.
              </p>
            )}
          </div>
        )}
        {removeError && (
          <p role="alert" className="text-sm text-destructive">
            {removeError}
          </p>
        )}
      </section>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Agregar dependencia</DialogTitle>
          <DialogDescription>
            {key} dependerá del ticket que elijas.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          disabled={busy}
          placeholder="Buscar por clave o título"
          aria-label="Buscar ticket"
        />
        <div
          role="group"
          aria-label="Tickets del proyecto"
          className="max-h-64 space-y-1 overflow-y-auto overscroll-contain"
        >
          {!matches.length && (
            <p className="p-3 text-sm text-muted-foreground">
              No hay tickets disponibles para esta búsqueda.
            </p>
          )}
          {matches.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={busy}
              aria-pressed={item.id === selected}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring',
                item.id === selected
                  ? 'border-primary/50 bg-accent'
                  : 'border-transparent'
              )}
              onClick={() => {
                setSelected(item.id)
                setSaveError('')
              }}
            >
              <span className="shrink-0 font-mono text-xs text-brand-foreground">
                {item.key}
              </span>
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
              {item.id === selected && (
                <Check
                  aria-hidden
                  className="size-4 shrink-0 text-brand-foreground"
                />
              )}
            </button>
          ))}
        </div>
        {saveError && (
          <p role="alert" className="text-sm text-destructive">
            {saveError}
          </p>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => changeOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!selected || busy}
            onClick={() => void add()}
          >
            {busy ? 'Guardando…' : 'Guardar dependencia'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
