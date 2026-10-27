"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Search, UserRound, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export interface DirectoryRole {
  label: string
  icon: React.ElementType
  color: string
}

interface PeopleDirectoryTableProps<T> {
  items: T[]
  noun: string
  tableLabel: string
  roleConfig: Record<string, DirectoryRole>
  getIdentity: (item: T) => { id: string; name: string; email: string; avatarUrl?: string; detail?: React.ReactNode }
  getRoles: (item: T) => string[]
  renderActions?: (item: T) => React.ReactNode
  renderRoles?: (item: T) => React.ReactNode
  error?: string
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
}

export function PeopleDirectoryTable<T>({ items, noun, tableLabel, roleConfig, getIdentity, getRoles, renderActions, renderRoles, error }: PeopleDirectoryTableProps<T>) {
  const [search, setSearch] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState("all")
  const [pageSize, setPageSize] = React.useState(10)
  const [page, setPage] = React.useState(1)
  const filtered = items.filter(item => {
    const { name, email } = getIdentity(item)
    return normalizeSearch(`${name} ${email}`).includes(normalizeSearch(search))
      && (roleFilter === "all" || getRoles(item).includes(roleFilter))
  })
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const startIndex = (currentPage - 1) * pageSize
  const hasFilters = search !== "" || roleFilter !== "all"

  React.useEffect(() => {
    setPage(previous => Math.min(previous, pageCount))
  }, [pageCount])

  const clearFilters = () => {
    setSearch("")
    setRoleFilter("all")
    setPage(1)
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input type="search" aria-label={`Buscar ${noun}`} placeholder="Buscar por nombre o correo…" value={search}
            onChange={event => { setSearch(event.target.value); setPage(1) }} className="h-9 bg-background pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={value => { setRoleFilter(value); setPage(1) }}>
          <SelectTrigger aria-label={`Filtrar ${noun} por rol`} className="h-9 w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            {Object.entries(roleConfig).map(([value, config]) => <SelectItem key={value} value={value}>{config.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {hasFilters && <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>Limpiar filtros</Button>}
      </div>
      {error && <p role="alert" className="border-b bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}
      <Table aria-label={tableLabel} className="table-fixed">
        <TableHeader className="hidden bg-muted/40 sm:table-header-group">
          <TableRow className="hover:bg-transparent">
            <TableHead scope="col" className="h-9 px-4 text-xs text-muted-foreground">Usuario</TableHead>
            <TableHead scope="col" className="h-9 w-44 px-3 text-xs text-muted-foreground">Rol</TableHead>
            {renderActions && <TableHead scope="col" className="h-9 w-24 px-3 text-right text-xs text-muted-foreground">Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody className="block sm:table-row-group">
          {filtered.slice(startIndex, startIndex + pageSize).map(item => {
            const { id, name, email, avatarUrl, detail } = getIdentity(item)
            return (
              <TableRow key={id} role="row" className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 px-3 py-2.5 sm:table-row sm:p-0">
                <TableCell className="min-w-0 p-0 sm:px-4 sm:py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-8 shrink-0">
                      {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-brand-foreground">
                        {name.split(" ").filter(Boolean).map(part => part[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium" title={name}>{name}</p>
                      {email && <p className="truncate text-xs text-muted-foreground" title={email}>{email}</p>}
                      {detail}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="col-start-1 row-start-2 p-0 pl-11 sm:px-3 sm:py-2.5">
                  {renderRoles ? renderRoles(item) : <div className="flex flex-wrap gap-1">
                    {getRoles(item).map(role => {
                      const config = roleConfig[role]
                      const Icon = config?.icon ?? UserRound
                      return <span key={role} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${config?.color ?? "bg-muted text-muted-foreground"}`}>
                        <Icon className="size-3" aria-hidden="true" />{config?.label ?? role}
                      </span>
                    })}
                  </div>}
                </TableCell>
                {renderActions && <TableCell className="col-start-2 row-span-2 row-start-1 p-0 sm:px-3 sm:py-2.5">
                  <div className="flex items-center justify-end gap-1">{renderActions(item)}</div>
                </TableCell>}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <Users className="mb-1 size-7 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium">{items.length === 0 ? `No hay ${noun}` : `No se encontraron ${noun}`}</p>
          <p className="text-xs text-muted-foreground">{items.length === 0 ? "Las personas que agregues aparecerán aquí." : "Prueba con otro nombre, correo o rol."}</p>
          {hasFilters && <Button type="button" size="sm" variant="outline" onClick={clearFilters}>Restablecer filtros</Button>}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t px-3 py-3">
        <p className="text-xs text-muted-foreground" aria-live="polite" aria-atomic="true">
          {filtered.length === 0 ? "0 resultados" : `${startIndex + 1}–${Math.min(startIndex + pageSize, filtered.length)} de ${filtered.length}`}
          {hasFilters && ` · ${items.length} en total`}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={String(pageSize)} onValueChange={value => { setPageSize(Number(value)); setPage(1) }}>
            <SelectTrigger aria-label={`${noun.charAt(0).toUpperCase() + noun.slice(1)} por página`} className="h-8 w-auto gap-2 border-transparent text-xs shadow-none"><SelectValue /></SelectTrigger>
            <SelectContent>{[10, 25, 50].map(size => <SelectItem key={size} value={String(size)}>{size} por página</SelectItem>)}</SelectContent>
          </Select>
          <nav aria-label={`Paginación de ${noun}`} className="flex items-center gap-1">
            <Button type="button" size="icon" variant="ghost" className="size-8" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label={`Página anterior de ${noun}`}><ChevronLeft className="size-4" aria-hidden="true" /></Button>
            <span className="min-w-12 text-center text-xs tabular-nums">{currentPage} / {pageCount}</span>
            <Button type="button" size="icon" variant="ghost" className="size-8" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label={`Página siguiente de ${noun}`}><ChevronRight className="size-4" aria-hidden="true" /></Button>
          </nav>
        </div>
      </div>
    </div>
  )
}
