"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Crown, Eye, Loader2, Pencil, Search, Shield, Trash2, UserRound, Users } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { WorkspaceMember, WorkspaceRole } from "@/services/userService"

export const workspaceRoleConfig = {
  owner:  { label: "Owner", icon: Crown, color: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300" },
  admin:  { label: "Admin", icon: Shield, color: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300" },
  member: { label: "Member", icon: UserRound, color: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300" },
  viewer: { label: "Viewer", icon: Eye, color: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-400/20 dark:bg-slate-400/10 dark:text-slate-300" },
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
}

interface WorkspaceMembersTableProps {
  members: WorkspaceMember[]
  onEditRole: (member: WorkspaceMember) => void
  onRemoveMember: (userId: string) => Promise<void>
}

export function WorkspaceMembersTable({ members, onEditRole, onRemoveMember }: WorkspaceMembersTableProps) {
  const [search, setSearch] = React.useState("")
  const [roleFilter, setRoleFilter] = React.useState<WorkspaceRole | "all">("all")
  const [pageSize, setPageSize] = React.useState(10)
  const [page, setPage] = React.useState(1)
  const [removingUserId, setRemovingUserId] = React.useState<string | null>(null)
  const [removeError, setRemoveError] = React.useState("")

  const filteredMembers = React.useMemo(() => {
    const query = normalizeSearch(search)
    return members.filter(member => {
      const identity = normalizeSearch(`${member.user?.name ?? member.userId} ${member.user?.email ?? ""}`)
      return (roleFilter === "all" || member.role === roleFilter) && identity.includes(query)
    })
  }, [members, search, roleFilter])

  const pageCount = Math.max(1, Math.ceil(filteredMembers.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const startIndex = (currentPage - 1) * pageSize
  const visibleMembers = filteredMembers.slice(startIndex, startIndex + pageSize)
  const hasFilters = search !== "" || roleFilter !== "all"

  // Keep the current page valid after a member is removed or changes role.
  React.useEffect(() => {
    setPage(previous => Math.min(previous, pageCount))
  }, [pageCount])

  const clearFilters = () => {
    setSearch("")
    setRoleFilter("all")
    setPage(1)
  }

  const removeMember = async (userId: string) => {
    if (removingUserId) return
    setRemovingUserId(userId)
    setRemoveError("")
    try {
      await onRemoveMember(userId)
    } catch (error) {
      setRemoveError(error instanceof Error ? error.message : "No se pudo eliminar al miembro. Intenta nuevamente.")
    } finally {
      setRemovingUserId(null)
    }
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            aria-label="Buscar miembros"
            placeholder="Buscar por nombre o correo…"
            value={search}
            onChange={event => { setSearch(event.target.value); setPage(1) }}
            className="h-9 bg-background pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={value => { setRoleFilter(value as WorkspaceRole | "all"); setPage(1) }}>
          <SelectTrigger aria-label="Filtrar miembros por rol" className="h-9 w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            {Object.entries(workspaceRoleConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>Limpiar filtros</Button>}
      </div>
      {removeError && <p role="alert" className="border-b bg-destructive/5 px-4 py-3 text-sm text-destructive">{removeError}</p>}
      <Table aria-label="Miembros del workspace" className="table-fixed">
        <TableHeader className="hidden bg-muted/40 sm:table-header-group">
          <TableRow className="hover:bg-transparent">
            <TableHead scope="col" className="h-9 px-4 text-xs text-muted-foreground">Usuario</TableHead>
            <TableHead scope="col" className="h-9 w-32 px-3 text-xs text-muted-foreground">Rol</TableHead>
            <TableHead scope="col" className="h-9 w-24 px-3 text-right text-xs text-muted-foreground">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="block sm:table-row-group">
          {visibleMembers.map(member => {
            const name = member.user?.name ?? member.userId
            const email = member.user?.email ?? ""
            const config = workspaceRoleConfig[member.role] ?? workspaceRoleConfig.member
            const Icon = config.icon
            const isRemoving = removingUserId === member.userId
            return (
              <TableRow key={member.id} role="row" className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 px-3 py-2.5 sm:table-row sm:p-0">
                <TableCell className="min-w-0 p-0 sm:px-4 sm:py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-brand-foreground">
                        {name.split(" ").filter(Boolean).map(part => part[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium" title={name}>{name}</p>
                      {email && <p className="truncate text-xs text-muted-foreground" title={email}>{email}</p>}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="col-start-1 row-start-2 p-0 pl-11 sm:px-3 sm:py-2.5">
                  <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${config.color}`}>
                    <Icon className="size-3" aria-hidden="true" />
                    {config.label}
                  </span>
                </TableCell>
                <TableCell className="col-start-2 row-span-2 row-start-1 p-0 sm:px-3 sm:py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted" onClick={() => onEditRole(member)} disabled={isRemoving} aria-label={`Editar rol de ${name}`}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar rol</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/40 dark:hover:bg-destructive/10" onClick={() => removeMember(member.userId)} disabled={removingUserId !== null} aria-label={`Eliminar a ${name} del workspace`}>
                          {isRemoving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Eliminar del workspace</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {filteredMembers.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <Users className="mb-1 size-7 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium">No se encontraron miembros</p>
          <p className="text-xs text-muted-foreground">Prueba con otro nombre, correo o rol.</p>
          <Button type="button" size="sm" variant="outline" onClick={clearFilters}>Restablecer filtros</Button>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t px-3 py-3">
        <p className="text-xs text-muted-foreground" aria-live="polite" aria-atomic="true">
          {filteredMembers.length === 0 ? "0 resultados" : `${startIndex + 1}–${Math.min(startIndex + pageSize, filteredMembers.length)} de ${filteredMembers.length}`}
          {hasFilters && ` · ${members.length} en total`}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={String(pageSize)} onValueChange={value => { setPageSize(Number(value)); setPage(1) }}>
            <SelectTrigger aria-label="Miembros por página" className="h-8 w-auto gap-2 border-transparent text-xs shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50].map(size => <SelectItem key={size} value={String(size)}>{size} por página</SelectItem>)}
            </SelectContent>
          </Select>
          <nav aria-label="Paginación de miembros" className="flex items-center gap-1">
            <Button type="button" size="icon" variant="ghost" className="size-8" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Página anterior de miembros">
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
            <span className="min-w-12 text-center text-xs tabular-nums">{currentPage} / {pageCount}</span>
            <Button type="button" size="icon" variant="ghost" className="size-8" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Página siguiente de miembros">
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </nav>
        </div>
      </div>
    </div>
  )
}
