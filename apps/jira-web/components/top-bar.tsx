'use client'

import * as React from 'react'
import { Search, Plus, Bell, Menu, SlidersHorizontal, LogOut, Shield } from 'lucide-react'
import { FlowBoardLogo } from '@/components/brand-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { getTeamMemberAssigneeId } from '@/lib/team-members'
import type { ApiProject, ApiSprint, ApiTeamMember } from '@/types/project'
import { useAuth } from '@/contexts/auth-context'

interface TopBarProps {
  onMenuClick: () => void
  isMobile: boolean
  currentProject: string
  onProjectChange: (projectId: string) => void
  onCreateTicket: () => void
  canWrite: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
  projects?: ApiProject[]
  activeSprint?: ApiSprint | null
  teamMembers?: ApiTeamMember[]
  filters: {
    assignee: string
    status: string
    priority: string
  }
  onFilterChange: (key: string, value: string) => void
}

export function TopBar({
  onMenuClick,
  isMobile,
  currentProject,
  onProjectChange,
  onCreateTicket,
  canWrite,
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  projects = [],
  activeSprint = null,
  teamMembers = [],
}: TopBarProps) {
  const { user, logout } = useAuth()
  const project = projects.find(p => p.id === currentProject)
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || user.email[0]?.toUpperCase() || 'U'

  return (
    <header className="sticky top-0 z-40 flex min-h-14 min-w-0 shrink-0 flex-wrap items-center gap-2 border-b border-b-primary/20 bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:gap-3 lg:px-6">
      {/* Mobile Menu Button */}
      {isMobile && (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Button variant="ghost" size="icon" className="size-10" aria-label="Abrir menú" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
          <FlowBoardLogo className="size-8 shrink-0" alt="FlowBoard" />
          <span className="hidden truncate font-semibold sm:inline">FlowBoard</span>
        </div>
      )}

      {/* Project Selector (Desktop) */}
      {!isMobile && (
        <div className="flex items-center gap-3">
          <Select value={currentProject} onValueChange={onProjectChange}>
            <SelectTrigger className="w-[180px] h-9 text-sm font-medium border-0 bg-secondary hover:bg-secondary/80">
              <div className="flex items-center gap-2">
                {project && (
                  <div 
                    className="w-2.5 h-2.5 rounded-sm shrink-0" 
                    style={{ backgroundColor: project.color ?? '#6b7280' }}
                  />
                )}
                <SelectValue placeholder="Seleccionar proyecto" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {projects.map((proj) => (
                <SelectItem key={proj.id} value={proj.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-sm" 
                      style={{ backgroundColor: proj.color ?? '#6b7280' }}
                    />
                    {proj.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeSprint && (
            <Badge variant="outline" className="hidden h-7 max-w-40 gap-1.5 truncate border-primary/30 bg-accent px-2.5 text-xs font-normal text-accent-foreground 2xl:inline-flex">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              {activeSprint.name}
            </Badge>
          )}
        </div>
      )}

      {/* Search */}
      <div className="order-last flex min-w-0 basis-full justify-center xl:order-none xl:mx-auto xl:max-w-md xl:flex-1 xl:basis-auto">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar tickets..."
            aria-label="Buscar tickets"
            className="w-full pl-9 h-9 bg-secondary border-0 focus-visible:ring-1"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Filters (Desktop) */}
      {!isMobile && (
        <div className="hidden 2xl:flex items-center gap-2">
          <Select value={filters.assignee} onValueChange={(v) => onFilterChange('assignee', v)}>
            <SelectTrigger className="w-[140px] h-8 text-xs border-dashed">
              <SelectValue placeholder="Asignado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="unassigned">Sin asignar</SelectItem>
              {teamMembers.map(member => (
                <SelectItem key={member.id} value={getTeamMemberAssigneeId(member)}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(v) => onFilterChange('status', v)}>
            <SelectTrigger className="w-[130px] h-8 text-xs border-dashed">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="backlog">Backlog</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.priority} onValueChange={(v) => onFilterChange('priority', v)}>
            <SelectTrigger className="w-[120px] h-8 text-xs border-dashed">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Actions */}
      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        {/* Filters Mobile */}
        {isMobile && (
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Filtros">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        )}

        {/* Create Ticket */}
        {canWrite && <Button
          size="sm" 
          className="h-9 gap-1.5 font-medium shadow-sm"
          onClick={onCreateTicket}
          aria-label="Crear ticket"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Crear ticket</span>
        </Button>}

        {/* Theme Toggle */}
        <ThemeToggle className="size-10" />

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-9 w-9 relative" aria-label="Notificaciones">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" aria-label="Menú de usuario">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-accent text-brand-foreground">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
                <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-md bg-secondary px-2 py-1 text-[11px] font-medium">
                  <Shield className="h-3 w-3" />
                  {user.roles.includes('admin') ? 'Administrador' : 'Usuario'}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Preferencias</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
