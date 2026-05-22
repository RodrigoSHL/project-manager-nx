'use client'

import * as React from 'react'
import { 
  LayoutDashboard, 
  Layers, 
  Zap, 
  Ticket, 
  BarChart3, 
  Users, 
  Settings,
  ChevronDown,
  Folder
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { projects, workspaces } from '@/lib/mock-data'

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '#dashboard' },
  { name: 'Backlog', icon: Layers, href: '#backlog' },
  { name: 'Sprint actual', icon: Zap, href: '#sprint' },
  { name: 'Todos los tickets', icon: Ticket, href: '#tickets' },
  { name: 'Reportes', icon: BarChart3, href: '#reports' },
  { name: 'Equipo', icon: Users, href: '#team' },
  { name: 'Configuración', icon: Settings, href: '#settings' },
]

interface MobileSidebarProps {
  open: boolean
  onClose: () => void
  activeView: string
  onViewChange: (view: string) => void
  currentProject: string
  onProjectChange: (projectId: string) => void
}

export function MobileSidebar({ 
  open, 
  onClose, 
  activeView, 
  onViewChange,
  currentProject,
  onProjectChange 
}: MobileSidebarProps) {
  const currentWorkspace = workspaces[0]
  const project = projects.find(p => p.id === currentProject) || projects[0]

  const handleNavClick = (href: string) => {
    onViewChange(href.replace('#', ''))
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              F
            </div>
            <SheetTitle className="font-semibold">FlowBoard</SheetTitle>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(100vh-65px)]">
          <div className="p-4 space-y-6">
            {/* Workspace Selector */}
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between h-10 px-3"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Avatar className="h-5 w-5 rounded">
                        <AvatarFallback className="rounded text-[10px] bg-primary/10 text-primary">
                          {currentWorkspace.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{currentWorkspace.name}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[calc(100%-2rem)]">
                  {workspaces.map((ws) => (
                    <DropdownMenuItem key={ws.id}>
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

            {/* Projects */}
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2 block">
                Proyectos
              </span>
              <div className="space-y-1">
                {projects.filter(p => p.workspaceId === currentWorkspace.id).map((proj) => (
                  <Button
                    key={proj.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-9 px-2",
                      currentProject === proj.id 
                        ? "bg-accent text-accent-foreground font-medium" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => {
                      onProjectChange(proj.id)
                      onClose()
                    }}
                  >
                    <div 
                      className="w-2.5 h-2.5 rounded-sm mr-2 shrink-0" 
                      style={{ backgroundColor: proj.color }}
                    />
                    <span className="truncate">{proj.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2 block">
                Navegación
              </span>
              <nav className="space-y-1">
                {navigation.map((item) => {
                  const isActive = activeView === item.href.replace('#', '')
                  return (
                    <Button
                      key={item.name}
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-10 px-2",
                        isActive 
                          ? "bg-accent text-primary font-medium" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => handleNavClick(item.href)}
                    >
                      <item.icon className="h-4 w-4 mr-3 shrink-0" />
                      <span>{item.name}</span>
                    </Button>
                  )
                })}
              </nav>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
