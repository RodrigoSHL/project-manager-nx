'use client'

import * as React from 'react'
import { Layers, LayoutGrid, Zap, LayoutDashboard, Ticket as TicketIcon, BarChart3, Users, Settings } from 'lucide-react'
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
import { 
  tickets as allTickets, 
  sprints, 
  users,
  Ticket,
  TicketStatus
} from '@/lib/mock-data'
import { getProjects } from '@/services/projectService'
import type { ApiProject } from '@/types/project'

export default function ProjectManagement() {
  const isMobile = useIsMobile()
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)
  const [activeView, setActiveView] = React.useState('sprint')
  const [currentProject, setCurrentProject] = React.useState('')
  const [apiProjects, setApiProjects] = React.useState<ApiProject[]>([])
  const [loadingProjects, setLoadingProjects] = React.useState(true)
  const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(null)
  const [ticketDetailOpen, setTicketDetailOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filters, setFilters] = React.useState({
    assignee: 'all',
    status: 'all',
    priority: 'all',
  })

  React.useEffect(() => {
    getProjects()
      .then((data) => {
        setApiProjects(data)
        if (data.length > 0) setCurrentProject(data[0].id)
      })
      .catch(console.error)
      .finally(() => setLoadingProjects(false))
  }, [])

  const activeSprint = sprints.find(s => s.projectId === currentProject && s.isActive)

  // Filter tickets
  const filteredTickets = React.useMemo(() => {
    return allTickets.filter(ticket => {
      if (ticket.projectId !== currentProject) return false
      if (searchQuery && !ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) && !ticket.key.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (filters.assignee !== 'all' && ticket.assigneeId !== filters.assignee) return false
      if (filters.status !== 'all' && ticket.status !== filters.status) return false
      if (filters.priority !== 'all' && ticket.priority !== filters.priority) return false
      return true
    })
  }, [currentProject, searchQuery, filters])

  const sprintTickets = filteredTickets.filter(t => t.sprintId === activeSprint?.id)

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setTicketDetailOpen(true)
  }

  const handleCreateTicket = (status?: TicketStatus) => {
    // In a real app, this would open a create ticket modal
    console.log('[v0] Create ticket', status)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Dashboard view content
  const DashboardView = () => {
    const todoCount = allTickets.filter(t => t.projectId === currentProject && t.status === 'todo').length
    const inProgressCount = allTickets.filter(t => t.projectId === currentProject && t.status === 'in_progress').length
    const inReviewCount = allTickets.filter(t => t.projectId === currentProject && t.status === 'in_review').length
    const doneCount = allTickets.filter(t => t.projectId === currentProject && t.status === 'done').length
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
          <h3 className="font-semibold mb-4">Actividad del equipo</h3>
          <div className="space-y-4">
            {users.slice(0, 4).map(user => {
              const userTickets = sprintTickets.filter(t => t.assigneeId === user.id)
              const completed = userTickets.filter(t => t.status === 'done').length
              return (
                <div key={user.id} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{completed}/{userTickets.length} tickets</span>
                    </div>
                    <Progress value={userTickets.length > 0 ? (completed / userTickets.length) * 100 : 0} className="h-1.5" />
                  </div>
                </div>
              )
            })}
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
        <p className="text-muted-foreground">{users.length} miembros del equipo</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map(user => {
          const userTickets = allTickets.filter(t => t.assigneeId === user.id && t.projectId === currentProject)
          return (
            <Card key={user.id} className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{user.name}</h4>
                  <p className="text-sm text-muted-foreground truncate">{user.role}</p>
                  <p className="text-xs text-muted-foreground mt-1">{userTickets.length} tickets asignados</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
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
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1">Backlog</h1>
              <p className="text-muted-foreground">Gestiona y prioriza el trabajo pendiente</p>
            </div>
            <BacklogView 
              tickets={filteredTickets}
              currentProject={currentProject}
              onTicketClick={handleTicketClick}
              onCreateTicket={() => handleCreateTicket()}
            />
          </div>
        )
      case 'sprint':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1">Sprint actual</h1>
              <p className="text-muted-foreground">Vista del sprint activo y tablero Kanban</p>
            </div>

            {activeSprint && (
              <SprintInfo sprint={activeSprint} tickets={sprintTickets} />
            )}

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
        onClose={() => {
          setTicketDetailOpen(false)
          setSelectedTicket(null)
        }}
      />
    </div>
  )
}
