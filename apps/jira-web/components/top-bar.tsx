'use client'

import * as React from 'react'
import { Search, Plus, Moon, Sun, Bell, Menu, Filter, SlidersHorizontal } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { projects, users, sprints } from '@/lib/mock-data'

interface TopBarProps {
  onMenuClick: () => void
  isMobile: boolean
  currentProject: string
  onProjectChange: (projectId: string) => void
  onCreateTicket: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
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
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange
}: TopBarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const project = projects.find(p => p.id === currentProject)
  const activeSprint = sprints.find(s => s.projectId === currentProject && s.isActive)
  const currentUser = users[0]

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      {/* Mobile Menu Button */}
      {isMobile && (
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
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
                    style={{ backgroundColor: project.color }}
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
                      style={{ backgroundColor: proj.color }}
                    />
                    {proj.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeSprint && (
            <Badge variant="outline" className="h-7 px-2.5 font-normal text-xs gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              {activeSprint.name}
            </Badge>
          )}
        </div>
      )}

      {/* Search */}
      <div className="flex-1 flex justify-center max-w-md mx-auto">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar tickets..."
            className="w-full pl-9 h-9 bg-secondary border-0 focus-visible:ring-1"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Filters (Desktop) */}
      {!isMobile && (
        <div className="hidden xl:flex items-center gap-2">
          <Select value={filters.assignee} onValueChange={(v) => onFilterChange('assignee', v)}>
            <SelectTrigger className="w-[140px] h-8 text-xs border-dashed">
              <SelectValue placeholder="Asignado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="text-[8px]">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {user.name.split(' ')[0]}
                  </div>
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
      <div className="flex items-center gap-2">
        {/* Filters Mobile */}
        {isMobile && (
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        )}

        {/* Create Ticket */}
        <Button 
          size="sm" 
          className="h-9 gap-1.5 font-medium shadow-sm"
          onClick={onCreateTicket}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Crear ticket</span>
        </Button>

        {/* Theme Toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{currentUser.name}</span>
                <span className="text-xs text-muted-foreground font-normal">{currentUser.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Preferencias</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Cerrar sesión</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
