'use client'

import * as React from 'react'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Layers, 
  Zap, 
  Ticket, 
  BarChart3, 
  Users, 
  Settings,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  Folder,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useWorkspace } from '@/contexts/workspace-context'
import type { ApiProject } from '@/types/project'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '#dashboard' },
  { name: 'Backlog', icon: Layers, href: '#backlog' },
  { name: 'Sprint actual', icon: Zap, href: '#sprint' },
  { name: 'Todos los tickets', icon: Ticket, href: '#tickets' },
  { name: 'Reportes', icon: BarChart3, href: '#reports' },
  { name: 'Equipo', icon: Users, href: '#team' },
  { name: 'Configuración', icon: Settings, href: '#settings' },
]

const PROJECT_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
]

interface AppSidebarProps {
  collapsed: boolean
  onToggle: () => void
  activeView: string
  onViewChange: (view: string) => void
  currentProject: string
  onProjectChange: (projectId: string) => void
  projects?: ApiProject[]
  loadingProjects?: boolean
}

export function AppSidebar({ 
  collapsed, 
  onToggle, 
  activeView, 
  onViewChange,
  currentProject,
  onProjectChange,
  projects = [],
  loadingProjects = false,
}: AppSidebarProps) {
  const { workspaces, selectedWorkspace, setSelectedWorkspace } = useWorkspace()

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}>
        {/* Header */}
        <div className="flex items-center h-14 px-3 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                F
              </div>
              <span className="font-semibold text-sidebar-foreground truncate">FlowBoard</span>
            </div>
          )}
          {collapsed && (
            <div className="flex items-center justify-center w-full">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                F
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              collapsed && "hidden"
            )}
            onClick={onToggle}
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>

        {/* Workspace Selector */}
        {!collapsed && (
          <div className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between h-9 px-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Avatar className="h-5 w-5 rounded">
                      <AvatarFallback className="rounded text-[10px] bg-primary/10 text-primary">
                        {selectedWorkspace?.name.charAt(0) ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{selectedWorkspace?.name ?? 'Sin workspace'}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {workspaces.map((ws) => (
                  <DropdownMenuItem key={ws.id} onClick={() => setSelectedWorkspace(ws)}>
                    <Avatar className="h-5 w-5 rounded mr-2">
                      <AvatarFallback className="rounded text-[10px]">
                        {ws.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {ws.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Projects */}
        {!collapsed && (
          <div className="px-3 mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider px-2">
                Proyectos
              </span>
              <Button variant="ghost" size="icon" className="h-5 w-5 text-sidebar-foreground/50 hover:text-sidebar-foreground">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-0.5">
              {loadingProjects && (
                <p className="text-xs text-sidebar-foreground/40 px-2 py-1">Cargando...</p>
              )}
              {!loadingProjects && projects.length === 0 && (
                <p className="text-xs text-sidebar-foreground/40 px-2 py-1">Sin proyectos</p>
              )}
              {projects.map((proj, index) => (
                <Button
                  key={proj.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-8 px-2 text-sm font-normal",
                    currentProject === proj.id 
                      ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                  onClick={() => onProjectChange(proj.id)}
                >
                  <div 
                    className="w-2.5 h-2.5 rounded-sm mr-2 shrink-0" 
                    style={{ backgroundColor: proj.color ?? PROJECT_COLORS[index % PROJECT_COLORS.length] }}
                  />
                  <span className="truncate">{proj.shortName ?? proj.name}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3">
          {!collapsed && (
            <span className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider px-2 mb-1 block">
              Navegación
            </span>
          )}
          <nav className="space-y-0.5">
            {navigation.map((item) => {
              const isActive = activeView === item.href.replace('#', '')
              const NavButton = (
                <Button
                  key={item.name}
                  variant="ghost"
                  className={cn(
                    "w-full h-9 text-sm font-normal",
                    collapsed ? "justify-center px-0" : "justify-start px-2",
                    isActive 
                      ? "bg-sidebar-accent text-sidebar-primary font-medium" 
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                  onClick={() => onViewChange(item.href.replace('#', ''))}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", !collapsed && "mr-2")} />
                  {!collapsed && <span>{item.name}</span>}
                </Button>
              )

              if (collapsed) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      {NavButton}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.name}
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return NavButton
            })}
          </nav>
        </ScrollArea>

        {/* Collapse Button (when collapsed) */}
        {collapsed && (
          <div className="p-3 border-t border-sidebar-border">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full h-9 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={onToggle}
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Expandir menú
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </aside>
    </TooltipProvider>
  )
}
