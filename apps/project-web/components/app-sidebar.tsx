"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Search,
  Plus,
  Folder,
  FolderOpen,
  Circle,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Settings,
  Home,
  BarChart3,
  Calendar,
  FileText,
  ChevronDown,
  Building2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreateProjectDialog } from "./create-project-dialog"
import { useProjects } from "@/hooks/useProjects"
import { useWorkspace } from "@/contexts/workspace-context"
import { ProjectStatus } from "@/types/project"

const navigationItems = [
  {
    title: "Dashboard",
    icon: Home,
    url: "#",
  },
  {
    title: "Reportes",
    icon: BarChart3,
    url: "#",
  },
  {
    title: "Calendario",
    icon: Calendar,
    url: "#",
  },
  {
    title: "Documentación",
    icon: FileText,
    url: "#",
  },
]

const getStatusIcon = (status: ProjectStatus) => {
  switch (status) {
    case ProjectStatus.PRODUCTION:
      return <CheckCircle className="h-3 w-3 text-green-600" />
    case ProjectStatus.STAGING:
      return <Clock className="h-3 w-3 text-yellow-600" />
    case ProjectStatus.DEVELOPMENT:
      return <Circle className="h-3 w-3 text-blue-600" />
    case ProjectStatus.DEPRECATED:
      return <AlertCircle className="h-3 w-3 text-gray-400" />
    default:
      return <Circle className="h-3 w-3 text-gray-400" />
  }
}

const getStatusColor = (status: ProjectStatus) => {
  switch (status) {
    case ProjectStatus.PRODUCTION:
      return "bg-green-100 text-green-800"
    case ProjectStatus.STAGING:
      return "bg-yellow-100 text-yellow-800"
    case ProjectStatus.DEVELOPMENT:
      return "bg-blue-100 text-blue-800"
    case ProjectStatus.DEPRECATED:
      return "bg-gray-100 text-gray-600"
    default:
      return "bg-gray-100 text-gray-600"
  }
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar>

export function AppSidebar({ ...props }: AppSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const { projects, loading, error } = useProjects()
  const { workspaces, selectedWorkspace, setSelectedWorkspace } = useWorkspace()

  // Separar proyectos activos y archivados
  const activeProjects = projects.filter(project => 
    project.status !== ProjectStatus.DEPRECATED
  )
  const archivedProjects = projects.filter(project => 
    project.status === ProjectStatus.DEPRECATED
  )

  const filteredActiveProjects = activeProjects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredArchivedProjects = archivedProjects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* Workspace selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-2 w-full rounded-md hover:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">
                  {selectedWorkspace?.name ?? "Sin workspace"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {selectedWorkspace ? `/${selectedWorkspace.slug}` : "Selecciona un workspace"}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground group-data-[collapsible=icon]:hidden shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            {workspaces.map(ws => (
              <DropdownMenuItem
                key={ws.id}
                onClick={() => setSelectedWorkspace(ws)}
                className={cn("flex flex-col items-start gap-0", selectedWorkspace?.id === ws.id && "bg-accent")}
              >
                <span className="font-medium">{ws.name}</span>
                <span className="text-xs text-muted-foreground">/{ws.slug}</span>
              </DropdownMenuItem>
            ))}
            {workspaces.length === 0 && (
              <DropdownMenuItem disabled>No hay workspaces</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Gestionar workspaces
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Barra de búsqueda */}
        <div className="px-2 py-2 group-data-[collapsible=icon]:hidden">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar proyectos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Navegación principal */}
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Proyectos Activos */}
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <span className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Proyectos Activos
                </span>
                <Badge variant="secondary" className="ml-auto">
                  {filteredActiveProjects.length}
                </Badge>
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredActiveProjects.map((project) => (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton asChild isActive={pathname === `/projects/${project.id}`} className="group/project">
                        <button onClick={() => router.push(`/projects/${project.id}`)} className="w-full py-6">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {getStatusIcon(project.status)}
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium text-sm">{project.shortName || project.name}</div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span className="truncate">{project.businessUnit}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge
                              variant="outline"
                              className={cn("text-xs px-1.5 py-0", getStatusColor(project.status))}
                            >
                              {project.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{project.teamMembers.length} miembros</span>
                          </div>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Proyectos Archivados */}
        <Collapsible className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <span className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  Archivados
                </span>
                <Badge variant="outline" className="ml-auto">
                  {filteredArchivedProjects.length}
                </Badge>
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredArchivedProjects.map((project) => (
                    <SidebarMenuItem key={project.id}>
                      <SidebarMenuButton asChild isActive={pathname === `/projects/${project.id}`}>
                        <button
                          onClick={() => router.push(`/projects/${project.id}`)}
                          className="w-full opacity-75 hover:opacity-100"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {getStatusIcon(project.status)}
                            <div className="min-w-0 flex-1">
                              <div className="truncate font-medium text-sm">{project.shortName || project.name}</div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span className="truncate">{project.businessUnit}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <CreateProjectDialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
              onProjectCreated={(project) => {
                router.push(`/projects/${project.id}`)
              }}
            >
              <Button variant="outline" className="w-full justify-start bg-transparent" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Proyecto
              </Button>
            </CreateProjectDialog>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Configuración</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
