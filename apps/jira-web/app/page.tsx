'use client'

import * as React from 'react'
import { Layers, LayoutGrid, Zap, Ticket as TicketIcon, BarChart3, Plus, Calendar, Pencil, Trash2, Bug, BookOpen, CheckSquare, LifeBuoy } from 'lucide-react'
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
import { getProjectsByWorkspace, getProjectTeamMembers } from '@/services/projectService'
import { getSprintsByProject, activateSprint, deleteSprint } from '@/services/sprintService'
import { getTicketsByProject, updateTicket } from '@/services/ticketService'
import { Button } from '@/components/ui/button'
import { CreateSprintDialog } from '@/components/create-sprint-dialog'
import { EditSprintDialog } from '@/components/edit-sprint-dialog'
import { CreateTicketDialog } from '@/components/create-ticket-dialog'
import { CreateSupportDialog } from '@/components/create-support-dialog'
import { SupportView } from '@/components/support-view'
import { AssigneeFilter } from '@/components/assignee-filter'
import { useWorkspace } from '@/contexts/workspace-context'
import {
  findTeamMemberByAssigneeId,
  isAssignedToTeamMember,
} from '@/lib/team-members'
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
  const [createTicketInitialSprintId, setCreateTicketInitialSprintId] = React.useState<string | null | undefined>(undefined)
  const [ticketDetailOpen, setTicketDetailOpen] = React.useState(false)
  const [createSupportOpen, setCreateSupportOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filters, setFilters] = React.useState({
    assignee: 'all',
    status: 'all',
    priority: 'all',
  })
  const [boardAssigneeFilters, setBoardAssigneeFilters] = React.useState<string[]>([])

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
    setFilters(prev => ({ ...prev, assignee: 'all' }))
    setBoardAssigneeFilters([])
    Promise.all([
      getSprintsByProject(currentProject),
      getTicketsByProject(currentProject),
      getProjectTeamMembers(currentProject),
    ]).then(([sprintsData, ticketsData, membersData]) => {
      setSprints(sprintsData)
      setTickets(ticketsData)
      setTeamMembers(membersData.filter(member => member.isActive !== false))
    }).catch(console.error)
  }, [currentProject])

  const activeSprint = sprints.find(s => s.projectId === currentProject && s.isActive)

  // Filter tickets
  const filteredTickets = React.useMemo(() => {
    return tickets.filter(ticket => {
      if (ticket.projectId !== currentProject) return false
      if (searchQuery && !ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) && !ticket.key.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (filters.assignee === 'unassigned' && ticket.assigneeId) return false
      if (filters.assignee !== 'all' && filters.assignee !== 'unassigned') {
        const member = findTeamMemberByAssigneeId(teamMembers, filters.assignee)
        if (!member || !isAssignedToTeamMember(ticket.assigneeId, member)) return false
      }
      if (filters.status !== 'all' && ticket.status !== filters.status) return false
      if (filters.priority !== 'all' && ticket.priority !== filters.priority) return false
      return true
    })
  }, [tickets, currentProject, searchQuery, filters, teamMembers])

  const sprintTickets = filteredTickets.filter(ticket => {
    if (ticket.sprintId !== activeSprint?.id) return false
    if (boardAssigneeFilters.length === 0) return true

    return boardAssigneeFilters.some(assigneeFilter => {
      if (assigneeFilter === 'unassigned') return !ticket.assigneeId
      const member = findTeamMemberByAssigneeId(teamMembers, assigneeFilter)
      return Boolean(member && isAssignedToTeamMember(ticket.assigneeId, member))
    })
  })

  const handleTicketClick = (ticket: ApiTicket) => {
    setSelectedTicket(ticket)
    setTicketDetailOpen(true)
  }

  const handleCreateTicket = (status?: ApiTicket['status'], sprintId?: string | null) => {
    setCreateTicketInitialStatus(status ?? 'todo')
    setCreateTicketInitialSprintId(sprintId)
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
    if (key === 'assignee') setBoardAssigneeFilters([])
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleBoardAssigneeFilterChange = (values: string[]) => {
    setFilters(prev => ({ ...prev, assignee: 'all' }))
    setBoardAssigneeFilters(values)
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
  const AllTicketsView = () => {
    const totalPoints = filteredTickets.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0)

    const ticketStatusConfig: Record<string, { label: string; className: string }> = {
      backlog: { label: 'Backlog', className: 'bg-muted text-muted-foreground' },
      todo: { label: 'To Do', className: 'bg-secondary text-secondary-foreground' },
      in_progress: { label: 'In Progress', className: 'bg-blue-500/20 text-blue-400' },
      in_review: { label: 'In Review', className: 'bg-amber-500/20 text-amber-500' },
      done: { label: 'Done', className: 'bg-emerald-500/20 text-emerald-400' },
      cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground' },
    }

    const ticketPriorityConfig: Record<string, { label: string; className: string; icon: string }> = {
      lowest: { label: 'Lowest', className: 'text-muted-foreground', icon: '▽' },
      low: { label: 'Low', className: 'text-muted-foreground', icon: '▽' },
      medium: { label: 'Medium', className: 'text-amber-400', icon: '◆' },
      high: { label: 'High', className: 'text-orange-400', icon: '▲' },
      urgent: { label: 'Urgent', className: 'text-destructive', icon: '⬆' },
    }

    const ticketTypeConfig: Record<string, { label: string; Icon: React.ElementType; className: string; bgClassName: string }> = {
      task: { label: 'Task', Icon: CheckSquare, className: 'text-primary', bgClassName: 'bg-primary/10' },
      bug: { label: 'Bug', Icon: Bug, className: 'text-destructive', bgClassName: 'bg-destructive/10' },
      story: { label: 'Story', Icon: BookOpen, className: 'text-emerald-400', bgClassName: 'bg-emerald-400/10' },
      epic: { label: 'Epic', Icon: Layers, className: 'text-purple-400', bgClassName: 'bg-purple-400/10' },
      subtask: { label: 'Subtask', Icon: CheckSquare, className: 'text-muted-foreground', bgClassName: 'bg-muted' },
      support: { label: 'Soporte', Icon: LifeBuoy, className: 'text-sky-400', bgClassName: 'bg-sky-400/10' },
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Todos los tickets</h1>
            <p className="text-muted-foreground">{filteredTickets.length} tickets en este proyecto</p>
          </div>
          {totalPoints > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Total Story Points:</span>
              <Badge variant="secondary" className="text-sm font-semibold px-3 py-1">{totalPoints} pts</Badge>
            </div>
          )}
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="w-10 px-3 py-3">
                    <input type="checkbox" className="rounded border-border accent-primary" />
                  </th>
                  <th className="w-12 px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</th>
                  <th className="w-28 px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Clave</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Título</th>
                  <th className="w-32 px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                  <th className="w-28 px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Prioridad</th>
                  <th className="w-20 px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Puntos</th>
                  <th className="w-24 px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Info</th>
                  <th className="w-36 px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Asignado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      No hay tickets para mostrar
                    </td>
                  </tr>
                ) : filteredTickets.map(ticket => {
                  const assignee = teamMembers.find(m => m.id === ticket.assigneeId || m.userId === ticket.assigneeId)
                  const statusCfg = ticketStatusConfig[ticket.status] ?? { label: ticket.status, className: 'bg-muted text-muted-foreground' }
                  const priorityCfg = ticketPriorityConfig[ticket.priority] ?? { label: ticket.priority, className: 'text-muted-foreground', icon: '○' }
                  const typeCfg = ticketTypeConfig[ticket.type] ?? ticketTypeConfig['task']
                  const TypeIcon = typeCfg.Icon

                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-accent/30 cursor-pointer transition-colors"
                      onClick={() => handleTicketClick(ticket)}
                    >
                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" className="rounded border-border accent-primary" />
                      </td>
                      <td className="px-3 py-3">
                        <div className={cn('w-7 h-7 rounded flex items-center justify-center', typeCfg.bgClassName)} title={typeCfg.label}>
                          <TypeIcon className={cn('h-4 w-4', typeCfg.className)} />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">{ticket.key}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium truncate max-w-xs">{ticket.title}</span>
                          {ticket.labels && ticket.labels.length > 0 && (
                            <div className="flex items-center gap-1 shrink-0">
                              {ticket.labels.slice(0, 2).map(label => (
                                <Badge key={label.id} variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                  {label.name}
                                </Badge>
                              ))}
                              {ticket.labels.length > 2 && (
                                <span className="text-xs text-muted-foreground">+{ticket.labels.length - 2}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap', statusCfg.className)}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={cn('flex items-center gap-1 text-xs font-medium whitespace-nowrap', priorityCfg.className)}>
                          <span className="text-base leading-none">{priorityCfg.icon}</span>
                          {priorityCfg.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {ticket.storyPoints ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-border text-xs font-medium">
                            {ticket.storyPoints}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full border border-dashed border-border/50" />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarImage src={assignee.avatar} alt={assignee.name} />
                              <AvatarFallback className="text-[10px]">
                                {assignee.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground truncate max-w-[80px]">{assignee.name.split(' ')[0]}</span>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-dashed border-border" />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-muted/20">
                  <td colSpan={6} className="px-3 py-2.5 text-xs text-muted-foreground">
                    {filteredTickets.length} tickets en total
                  </td>
                  <td colSpan={3} className="px-3 py-2.5 text-xs text-muted-foreground text-right">
                    Story Points: {totalPoints}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>
    )
  }

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
            {['story', 'task', 'bug', 'support'].map(type => {
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
              onCreateTicket={(sprintId) => handleCreateTicket(undefined, sprintId)}
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

                <AssigneeFilter
                  members={teamMembers}
                  values={boardAssigneeFilters}
                  onChange={handleBoardAssigneeFilterChange}
                />

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
                      teamMembers={teamMembers}
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
                          teamMembers={teamMembers}
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
      case 'support':
        return (
          <SupportView
            tickets={tickets}
            projectId={currentProject}
            teamMembers={teamMembers}
            onCreateSupport={() => setCreateSupportOpen(true)}
            onTicketUpdated={handleTicketUpdated}
          />
        )
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
          teamMembers={teamMembers}
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

      {editingSprint && (
        <EditSprintDialog
          open
          onOpenChange={open => { if (!open) setEditingSprint(null) }}
          sprint={editingSprint}
          projectId={currentProject}
          onUpdated={handleSprintUpdated}
        />
      )}

      <CreateTicketDialog
        open={createTicketOpen}
        onOpenChange={setCreateTicketOpen}
        projectId={currentProject}
        sprints={sprints}
        teamMembers={teamMembers}
        initialStatus={createTicketInitialStatus}
        initialSprintId={createTicketInitialSprintId}
        onCreated={handleTicketCreated}
      />

      <CreateSupportDialog
        open={createSupportOpen}
        onOpenChange={setCreateSupportOpen}
        projectId={currentProject}
        teamMembers={teamMembers}
        onCreated={handleTicketCreated}
      />
    </div>
  )
}
