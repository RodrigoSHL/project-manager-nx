'use client'

import * as React from 'react'
import { Layers, LayoutGrid, Zap, LayoutDashboard, Ticket as TicketIcon, BarChart3, Users, Settings, Plus, Calendar, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { AppSidebar } from '@/components/app-sidebar'
import { MobileSidebar } from '@/components/mobile-sidebar'
import { TopBar } from '@/components/top-bar'
import { KanbanBoard } from '@/components/kanban-board'
import { BacklogView } from '@/components/backlog-view'
import { TicketDetail } from '@/components/ticket-detail'
import { SprintInfo } from '@/components/sprint-info'
import { TicketCard } from '@/components/ticket-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getProjectsByWorkspace, getProjectTeamMembers } from '@/services/projectService'
import { getSprintsByProject, activateSprint, deleteSprint } from '@/services/sprintService'
import { getTicketsByProject, updateTicket } from '@/services/ticketService'
import { Button } from '@/components/ui/button'
import { CreateSprintDialog } from '@/components/create-sprint-dialog'
import { EditSprintDialog } from '@/components/edit-sprint-dialog'
import { CreateTicketDialog } from '@/components/create-ticket-dialog'
import { useWorkspace } from '@/contexts/workspace-context'
import type { ApiProject, ApiSprint, ApiTicket, ApiTeamMember } from '@/types/project'

export default function ProjectManagement() {
  const isMobile = useIsMobile()
  const { selectedWorkspace } = useWorkspace()
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)
  const [activeView, setActiveView] = React.useState('sprint')
  const [currentProject, setCurrentProject] = React.useState('')
  const [apiProjects, setApiProjects] = React.useState<ApiProject[]>([])
  const [loadingProjects, setLoadingProjects] = React.useState(true)
  const [sprints, setSprints] = React.useState<ApiSprint[]>([])
  const [tickets, setTickets] = React.useState<ApiTicket[]>([])
  const [teamMembers, setTeamMembers] = React.useState<ApiTeamMember[]>([])
  const [selectedTicket, setSelectedTicket] = React.useState<ApiTicket | null>(null)
  const [createSprintOpen, setCreateSprintOpen] = React.useState(false)
  const [editingSprint, setEditingSprint] = React.useState<ApiSprint | null>(null)
  const [createTicketOpen, setCreateTicketOpen] = React.useState(false)
  const [createTicketInitialStatus, setCreateTicketInitialStatus] = React.useState<ApiTicket['status']>('todo')
  const [ticketDetailOpen, setTicketDetailOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filters, setFilters] = React.useState({
    assignee: 'all',
    status: 'all',
    priority: 'all',
  })

  React.useEffect(() => {
    if (!selectedWorkspace) {
      setApiProjects([])
      setCurrentProject('')
      setLoadingProjects(false)
      return
    }
    setLoadingProjects(true)
    getProjectsByWorkspace(selectedWorkspace.id)
      .then((data) => {
        setApiProjects(data)
        setCurrentProject(prev => data.find(p => p.id === prev) ? prev : (data[0]?.id ?? ''))
      })
      .catch(console.error)
      .finally(() => setLoadingProjects(false))
  }, [selectedWorkspace])

  React.useEffect(() => {
    if (!currentProject) return
    setSprints([])
    setTickets([])
    setTeamMembers([])
    Promise.all([
      getSprintsByProject(currentProject),
      getTicketsByProject(currentProject),
      getProjectTeamMembers(currentProject),
    ]).then(([sprintsData, ticketsData, membersData]) => {
      setSprints(sprintsData)
      setTickets(ticketsData)
      setTeamMembers(membersData)
    }).catch(console.error)
  }, [currentProject])

  const activeSprint = sprints.find(s => s.projectId === currentProject && s.isActive)

  // Filter tickets
  const filteredTickets = React.useMemo(() => {
    return tickets.filter(ticket => {
      if (ticket.projectId !== currentProject) return false
      if (searchQuery && !ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) && !ticket.key.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (filters.assignee !== 'all' && ticket.assigneeId !== filters.assignee) return false
      if (filters.status !== 'all' && ticket.status !== filters.status) return false
      if (filters.priority !== 'all' && ticket.priority !== filters.priority) return false
      return true
    })
  }, [tickets, currentProject, searchQuery, filters])

  const sprintTickets = filteredTickets.filter(t => t.sprintId === activeSprint?.id)

  const handleTicketClick = (ticket: ApiTicket) => {
    setSelectedTicket(ticket)
    setTicketDetailOpen(true)
  }

  const handleCreateTicket = (status?: ApiTicket['status']) => {
    setCreateTicketInitialStatus(status ?? 'todo')
    setCreateTicketOpen(true)
  }

  const handleTicketCreated = (ticket: ApiTicket) => {
    setTickets(prev => [ticket, ...prev])
  }

  const handleTicketUpdated = (ticket: ApiTicket) => {
    setTickets(prev => prev.map(t => t.id === ticket.id ? ticket : t))
    setSelectedTicket(ticket)
  }

  const handleStatusChange = async (ticketId: string, status: ApiTicket['status']) => {
    try {
      const updated = await updateTicket(currentProject, ticketId, { status })
      setTickets(prev => prev.map(t => t.id === ticketId ? updated : t))
      if (selectedTicket?.id === ticketId) setSelectedTicket(updated)
    } catch (err) {
      console.error('Error updating ticket status', err)
    }
  }

  const handleSprintCreated = (sprint: ApiSprint) => {
    setSprints(prev => [sprint, ...prev])
  }

  const handleSprintUpdated = (updated: ApiSprint) => {
    setSprints(prev => prev.map(s => s.id === updated.id ? updated : s))
  }

  const handleDeleteSprint = async (sprintId: string) => {
    try {
      await deleteSprint(currentProject, sprintId)
      setSprints(prev => prev.filter(s => s.id !== sprintId))
    } catch (err) {
      console.error('Error deleting sprint', err)
    }
  }

  const handleActivateSprint = async (sprintId: string) => {
    try {
      const activated = await activateSprint(currentProject, sprintId)
      setSprints(prev => prev.map(s => ({ ...s, isActive: s.id === activated.id })))
    } catch (err) {
      console.error('Error activating sprint', err)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Dashboard view content
  const DashboardView = () => {
    const todoCount = tickets.filter(t => t.projectId === currentProject && t.status === 'todo').length
    const inProgressCount = tickets.filter(t => t.projectId === currentProject && t.status === 'in_progress').length
    const inReviewCount = tickets.filter(t => t.projectId === currentProject && t.status === 'in_review').length
    const doneCount = tickets.filter(t => t.projectId === currentProject && t.status === 'done').length
    const totalPoints = sprintTickets.reduce((acc, t) => acc + (t.storyPoints || 0), 0)
    const completedPoints = sprintTickets.filter(t => t.status === 'done').reduce((acc, t) => acc + (t.storyPoints || 0), 0)

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Dashboard</h1>
          <p className="text-muted-foreground">Resumen del proyecto y métricas del sprint actual</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <TicketIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todoCount}</p>
                <p className="text-xs text-muted-foreground">To Do</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressCount}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <BarChart3 className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inReviewCount}</p>
                <p className="text-xs text-muted-foreground">In Review</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <LayoutGrid className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{doneCount}</p>
                <p className="text-xs text-muted-foreground">Done</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Sprint Progress */}
        {activeSprint && (
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">{activeSprint.name}</h3>
                <p className="text-sm text-muted-foreground">{activeSprint.goal}</p>
              </div>
              <Badge variant="outline" className="gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Activo
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Story Points completados</span>
                <span className="font-medium">{completedPoints} / {totalPoints}</span>
              </div>
              <Progress value={totalPoints > 0 ? (completedPoints / totalPoints) * 100 : 0} className="h-2" />
            </div>
          </Card>
        )}

        {/* Team Activity */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Tickets del sprint</h3>
          <div className="space-y-2">
            {sprintTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay tickets en el sprint activo.</p>
            ) : (
              sprintTickets.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center justify-between text-sm py-1">
                  <span className="truncate flex-1 mr-4">{t.title}</span>
                  <Badge variant="outline" className="text-xs shrink-0">{t.status}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    )
  }

  // All Tickets view
  const AllTicketsView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Todos los tickets</h1>
        <p className="text-muted-foreground">{filteredTickets.length} tickets en este proyecto</p>
      </div>
      <div className="space-y-2">
        {filteredTickets.map(ticket => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onClick={() => handleTicketClick(ticket)}
            variant="list"
          />
        ))}
      </div>
    </div>
  )

  // Reports view
  const ReportsView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Reportes</h1>
        <p className="text-muted-foreground">Métricas y análisis del proyecto</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Distribución por tipo</h3>
          <div className="space-y-3">
            {['story', 'task', 'bug'].map(type => {
              const count = filteredTickets.filter(t => t.type === type).length
              const percent = filteredTickets.length > 0 ? (count / filteredTickets.length) * 100 : 0
              return (
                <div key={type} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{type}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <Progress value={percent} className="h-2" />
                </div>
              )
            })}
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Distribución por prioridad</h3>
          <div className="space-y-3">
            {['urgent', 'high', 'medium', 'low'].map(priority => {
              const count = filteredTickets.filter(t => t.priority === priority).length
              const percent = filteredTickets.length > 0 ? (count / filteredTickets.length) * 100 : 0
              return (
                <div key={priority} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{priority}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <Progress value={percent} className="h-2" />
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )

  // Team view
  const TeamView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Equipo</h1>
        <p className="text-muted-foreground">Miembros del proyecto</p>
      </div>
      <Card className="p-5">
        <p className="text-sm text-muted-foreground">La gestión de equipo está disponible en Project Manager.</p>
      </Card>
    </div>
  )

  // Settings view
  const SettingsView = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Configuración</h1>
        <p className="text-muted-foreground">Ajustes del proyecto y preferencias</p>
      </div>
      <Card className="p-5">
        <h3 className="font-semibold mb-4">Información del proyecto</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Nombre</label>
            <p className="font-medium">{apiProjects.find(p => p.id === currentProject)?.name}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Clave</label>
            <p className="font-medium">{apiProjects.find(p => p.id === currentProject)?.key}</p>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />
      case 'backlog':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight mb-1">Backlog</h1>
                <p className="text-muted-foreground">Gestiona y prioriza el trabajo pendiente</p>
              </div>
              <Button onClick={() => setCreateSprintOpen(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo sprint
              </Button>
            </div>
            <BacklogView 
              tickets={filteredTickets}
              sprints={sprints}
              currentProject={currentProject}
              onTicketClick={handleTicketClick}
              onCreateTicket={() => handleCreateTicket()}
            />
          </div>
        )
      case 'sprint':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight mb-1">Sprint actual</h1>
                <p className="text-muted-foreground">Vista del sprint activo y tablero Kanban</p>
              </div>
              {!activeSprint && (
                <Button onClick={() => setCreateSprintOpen(true)} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo sprint
                </Button>
              )}
            </div>

            {!activeSprint && (
              <div className="flex flex-col items-center gap-6 py-4">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted">
                    <Zap className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="font-semibold">No hay un sprint activo</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Activa un sprint existente o crea uno nuevo para empezar.
                    </p>
                  </div>
                  <Button onClick={() => setCreateSprintOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Crear sprint
                  </Button>
                </div>

                {sprints.filter(s => !s.isActive).length > 0 && (
                  <div className="w-full max-w-md space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Sprints disponibles</span>
                    </div>
                    {sprints.filter(s => !s.isActive).map(s => {
                      const sprintTicketCount = tickets.filter(t => t.sprintId === s.id).length
                      const startLabel = s.startDate ? new Date(s.startDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) : null
                      const endLabel = s.endDate ? new Date(s.endDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) : null
                      return (
                        <div
                          key={s.id}
                          className="group flex items-center gap-3 px-4 py-3 rounded-xl border bg-card hover:border-primary/30 hover:bg-accent/30 transition-all duration-150"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted shrink-0">
                            <Zap className="h-4 w-4 text-muted-foreground" />
                          </div>

                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-semibold truncate">{s.name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              {startLabel && endLabel && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {startLabel} – {endLabel}
                                </span>
                              )}
                              {sprintTicketCount > 0 ? (
                                <span className="text-xs text-muted-foreground">{sprintTicketCount} ticket{sprintTicketCount !== 1 ? 's' : ''}</span>
                              ) : (
                                <span className="text-xs text-muted-foreground/50 italic">Sin tickets</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost" className="h-7 w-7" title="Editar sprint" onClick={() => setEditingSprint(s)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {sprintTicketCount === 0 && (
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" title="Eliminar sprint" onClick={() => handleDeleteSprint(s.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>

                          <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs" onClick={() => handleActivateSprint(s.id)}>
                            Activar
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {activeSprint && (
              <>
                <SprintInfo sprint={activeSprint} tickets={sprintTickets} onEdit={() => setEditingSprint(activeSprint)} />

                <Tabs defaultValue="board" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="board" className="gap-2">
                      <LayoutGrid className="h-4 w-4" />
                      Board
                    </TabsTrigger>
                    <TabsTrigger value="list" className="gap-2">
                      <Layers className="h-4 w-4" />
                      Lista
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="board" className="h-[calc(100vh-380px)] min-h-[400px]">
                    <KanbanBoard 
                      tickets={sprintTickets}
                      onTicketClick={handleTicketClick}
                      onCreateTicket={handleCreateTicket}
                      onStatusChange={handleStatusChange}
                    />
                  </TabsContent>
                  <TabsContent value="list">
                    <div className="space-y-2">
                      {sprintTickets.map(ticket => (
                        <TicketCard
                          key={ticket.id}
                          ticket={ticket}
                          onClick={() => handleTicketClick(ticket)}
                          variant="list"
                        />
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Inactive sprints */}
                {sprints.filter(s => !s.isActive).length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Otros sprints</span>
                      <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {sprints.filter(s => !s.isActive).length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {sprints.filter(s => !s.isActive).map(s => {
                        const sprintTicketCount = tickets.filter(t => t.sprintId === s.id).length
                        const startLabel = s.startDate ? new Date(s.startDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) : null
                        const endLabel = s.endDate ? new Date(s.endDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }) : null
                        return (
                          <div
                            key={s.id}
                            className="group flex items-center gap-4 px-4 py-3 rounded-xl border bg-card hover:border-primary/30 hover:bg-accent/30 transition-all duration-150"
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted shrink-0">
                              <Zap className="h-4 w-4 text-muted-foreground" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{s.name}</p>
                              <div className="flex items-center gap-3 mt-0.5">
                                {startLabel && endLabel && (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {startLabel} – {endLabel}
                                  </span>
                                )}
                                {sprintTicketCount > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {sprintTicketCount} ticket{sprintTicketCount !== 1 ? 's' : ''}
                                  </span>
                                )}
                                {sprintTicketCount === 0 && (
                                  <span className="text-xs text-muted-foreground/50 italic">Sin tickets</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                title="Editar sprint"
                                onClick={() => setEditingSprint(s)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              {sprintTicketCount === 0 && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  title="Eliminar sprint"
                                  onClick={() => handleDeleteSprint(s.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              className="shrink-0 h-7 text-xs"
                              onClick={() => handleActivateSprint(s.id)}
                            >
                              Activar
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )
      case 'tickets':
        return <AllTicketsView />
      case 'reports':
        return <ReportsView />
      case 'team':
        return <TeamView />
      case 'settings':
        return <SettingsView />
      default:
        return <DashboardView />
    }
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <AppSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          activeView={activeView}
          onViewChange={setActiveView}
          currentProject={currentProject}
          onProjectChange={setCurrentProject}
          projects={apiProjects}
          loadingProjects={loadingProjects}
        />
      )}

      {/* Mobile Sidebar */}
      <MobileSidebar
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        activeView={activeView}
        onViewChange={setActiveView}
        currentProject={currentProject}
        onProjectChange={setCurrentProject}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          onMenuClick={() => setMobileSidebarOpen(true)}
          isMobile={!!isMobile}
          currentProject={currentProject}
          onProjectChange={setCurrentProject}
          onCreateTicket={() => handleCreateTicket()}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFilterChange={handleFilterChange}
          projects={apiProjects}
          activeSprint={activeSprint}
        />

        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Ticket Detail Panel */}
      <TicketDetail
        ticket={selectedTicket}
        open={ticketDetailOpen}
        projectId={currentProject}
        teamMembers={teamMembers}
        onUpdated={handleTicketUpdated}
        onClose={() => {
          setTicketDetailOpen(false)
          setSelectedTicket(null)
        }}
      />

      <CreateSprintDialog
        open={createSprintOpen}
        onOpenChange={setCreateSprintOpen}
        projectId={currentProject}
        onCreated={handleSprintCreated}
      />

      <EditSprintDialog
        open={!!editingSprint}
        onOpenChange={open => { if (!open) setEditingSprint(null) }}
        sprint={editingSprint!}
        projectId={currentProject}
        onUpdated={handleSprintUpdated}
      />

      <CreateTicketDialog
        open={createTicketOpen}
        onOpenChange={setCreateTicketOpen}
        projectId={currentProject}
        sprints={sprints}
        initialStatus={createTicketInitialStatus}
        onCreated={handleTicketCreated}
      />
    </div>
  )
}
