"use client"

import * as React from "react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { ProjectStatusBadge } from "./project-status-badge"
import { TopNavbar } from "./top-navbar"
import {
  ExternalLink,
  Database,
  Shield,
  Users,
  FileText,
  Calendar,
  Link,
  Server,
  Cloud,
  GitBranch,
  Clock,
  AlertCircle,
  CheckCircle,
  Mail,
  MessageSquare,
  BookOpen,
  Target,
  Zap,
  Loader2,
  Edit3,
  Phone,
  AlertTriangle,
  Palette,
  Activity,
  Rocket,
  TestTube,
  Globe,
  Home,
  Code,
  Image,
} from "lucide-react"
import { useProjects } from "@/hooks/useProjects"
import { Project, FileType } from "@/types/project"
import { FileService } from "@/services/fileService"
import { EditProjectDialog } from "./edit-project-dialog"
import { EditRepositoriesDialog } from "./edit-repositories-dialog"
import { EditTeamMembersDialog } from "./edit-team-members-dialog"
import { EditTasksDialog } from "./edit-tasks-dialog"
import { EditUsefulLinksDialog } from "./edit-useful-links-dialog"
import { EditEnvironmentsDialog } from "./edit-environments-dialog"
import { EditDocumentsDialog } from "./edit-documents-dialog"
import { EditCloudServicesDialog } from "./edit-cloud-services-dialog"
import { ArchitectureDiagramDialog } from "./architecture-diagram-dialog"
import { ArchitectureViewerDialog } from "./architecture-viewer-dialog"
import { useAuth } from "@/contexts/auth-context"
import { isProjectAdmin } from "@/lib/auth"


export function ProjectDashboard({ projectId }: { projectId?: string }) {
  const { projects, currentProject, setCurrentProject, loading, error, updateProject, updateProjectInList } = useProjects()
  const { user } = useAuth()
  const isAdmin = isProjectAdmin(user.roles)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editRepositoriesDialogOpen, setEditRepositoriesDialogOpen] = useState(false)
  const [editTeamMembersDialogOpen, setEditTeamMembersDialogOpen] = useState(false)
  const [editTasksDialogOpen, setEditTasksDialogOpen] = useState(false)
  const [editUsefulLinksDialogOpen, setEditUsefulLinksDialogOpen] = useState(false)
  const [editEnvironmentsDialogOpen, setEditEnvironmentsDialogOpen] = useState(false)
  const [editDocumentsDialogOpen, setEditDocumentsDialogOpen] = useState(false)
  const [editCloudServicesDialogOpen, setEditCloudServicesDialogOpen] = useState(false)
  const [architectureDiagramDialogOpen, setArchitectureDiagramDialogOpen] = useState(false)
  const [architectureViewerDialogOpen, setArchitectureViewerDialogOpen] = useState(false)

  // Seleccionar el proyecto de la URL cuando los proyectos estén cargados
  React.useEffect(() => {
    if (!projectId || loading) return
    const found = projects.find(p => p.id === projectId)
    if (found) setCurrentProject(found)
  }, [projectId, projects, loading])

  // Manejar cambio de proyecto activo (por compatibilidad)
  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      setCurrentProject(project)
    }
  }

  // Manejar edición del proyecto
  const handleEditProject = async (updatedProject: Partial<Project>) => {
    if (currentProject) {
      await updateProject(currentProject.id, updatedProject)
    }
  }

  // Manejar edición de repositorios
  const handleEditRepositories = async (updatedProject: Project) => {
    // No necesitamos hacer nada aquí ya que el modal maneja la actualización directamente
  }

  // Actualizar proyecto directamente en el estado
  const handleProjectUpdate = (updatedProject: Project) => {
    updateProjectInList(updatedProject)
  }

  // Manejar edición de miembros del equipo
  const handleEditTeamMembers = async (updatedProject: Project) => {
    // No necesitamos hacer nada aquí ya que el modal maneja la actualización directamente
  }

  // Manejar edición de tareas
  const handleEditTasks = async (updatedProject: Project) => {
    // No necesitamos hacer nada aquí ya que el modal maneja la actualización directamente
  }

  // Manejar edición de enlaces útiles
  const handleEditUsefulLinks = async (updatedProject: Project) => {
    // No necesitamos hacer nada aquí ya que el modal maneja la actualización directamente
  }

  // Manejar edición de entornos
  const handleEditEnvironments = async (updatedProject: Project) => {
    // No necesitamos hacer nada aquí ya que el modal maneja la actualización directamente
  }

  // Manejar edición de documentos
  const handleEditDocuments = async (updatedProject: Project) => {
    // No necesitamos hacer nada aquí ya que el modal maneja la actualización directamente
  }

  // Manejar edición de servicios cloud
  const handleEditCloudServices = async (updatedProject: Project) => {
    // No necesitamos hacer nada aquí ya que el modal maneja la actualización directamente
  }

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, string> = {
      'tech_lead': 'Tech Lead',
      'developer': 'Developer',
      'devops': 'DevOps',
      'product_owner': 'Product Owner',
      'scrum_master': 'Scrum Master',
      'qa': 'QA',
      'designer': 'Designer',
      'architect': 'Architect',
      'member': 'Miembro',
      'analyst': 'Analista',
      'technician': 'Técnico',
    }
    return roleMap[role] || role
  }

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; variant: string }> = {
      'low': { label: 'Baja', variant: 'outline' },
      'medium': { label: 'Media', variant: 'secondary' },
      'high': { label: 'Alta', variant: 'default' },
      'critical': { label: 'Crítica', variant: 'destructive' }
    }
    const priorityInfo = priorityMap[priority] || { label: priority, variant: 'secondary' }
    return <Badge variant={priorityInfo.variant as any} className="text-xs">{priorityInfo.label}</Badge>
  }

  const getLinkIcon = (type: string) => {
    const iconMap: Record<string, { icon: any; color: string }> = {
      'documentation': { icon: FileText, color: 'text-blue-600' },
      'design': { icon: Palette, color: 'text-purple-600' },
      'monitoring': { icon: Activity, color: 'text-green-600' },
      'communication': { icon: MessageSquare, color: 'text-yellow-600' },
      'repository': { icon: GitBranch, color: 'text-muted-foreground' },
      'deployment': { icon: Rocket, color: 'text-orange-600' },
      'testing': { icon: TestTube, color: 'text-red-600' },
      'other': { icon: Globe, color: 'text-muted-foreground' }
    }
    const iconInfo = iconMap[type] || { icon: Globe, color: 'text-muted-foreground' }
    const IconComponent = iconInfo.icon
    return <IconComponent className={`h-4 w-4 ${iconInfo.color}`} />
  }

  const getEnvironmentTypeIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      'local': Home,
      'development': Code,
      'testing': TestTube,
      'staging': Database,
      'production': Rocket
    }
    const IconComponent = iconMap[type] || Globe
    return <IconComponent className="h-4 w-4 text-muted-foreground" />
  }

  const getEnvironmentTypeLabel = (type: string) => {
    const labelMap: Record<string, string> = {
      'local': 'Local',
      'development': 'Desarrollo',
      'testing': 'Testing',
      'staging': 'Staging',
      'production': 'Producción'
    }
    return labelMap[type] || type
  }

  const getCloudProviderIcon = (provider: string) => {
    const iconMap: Record<string, any> = {
      'aws': Cloud,
      'azure': Cloud,
      'gcp': Cloud,
      'digital_ocean': Cloud,
      'heroku': Cloud,
      'vercel': Cloud,
      'netlify': Cloud
    }
    const IconComponent = iconMap[provider] || Cloud
    return <IconComponent className="h-4 w-4 text-muted-foreground" />
  }

  const getCloudProviderLabel = (provider: string) => {
    const labelMap: Record<string, string> = {
      'aws': 'AWS',
      'azure': 'Azure',
      'gcp': 'Google Cloud',
      'digital_ocean': 'Digital Ocean',
      'heroku': 'Heroku',
      'vercel': 'Vercel',
      'netlify': 'Netlify'
    }
    return labelMap[provider] || provider
  }

  const getCloudServiceTypeIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      'Compute': Server,
      'Storage': Database,
      'Database': Database,
      'Networking': Globe,
      'Security': Shield,
      'Monitoring': Activity,
      'Analytics': Activity,
      'AI/ML': Zap,
      'CDN': Globe,
      'Load Balancer': Server,
      'Container': Server,
      'Serverless': Zap,
      'Other': Cloud
    }
    const IconComponent = iconMap[type] || Cloud
    return <IconComponent className="h-4 w-4 text-muted-foreground" />
  }

  // Función para obtener el diagrama de arquitectura más reciente
  const getLatestArchitectureDiagram = () => {
    if (!currentProject?.files || currentProject.files.length === 0) {
      return null
    }

    const architectureFiles = currentProject.files.filter(
      file => file.type === 'architecture'
    )

    if (architectureFiles.length === 0) {
      return null
    }

    // Ordenar por fecha de subida (más reciente primero) y tomar el primero
    return architectureFiles.sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )[0]
  }

  // Función para obtener el icono del archivo
  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return '🖼️'
    if (mimetype.includes('pdf')) return '📄'
    if (mimetype.includes('svg')) return '🎨'
    return '📎'
  }

  // Función para manejar el clic en el diagrama
  const handleArchitectureClick = () => {
    const latestDiagram = getLatestArchitectureDiagram()
    if (latestDiagram) {
      setArchitectureViewerDialogOpen(true)
    } else if (isAdmin) {
      setArchitectureDiagramDialogOpen(true)
    }
  }

  const getDocumentTypeBadge = (type: FileType) => {
    const typeMap: Record<FileType, { label: string; color: string }> = {
      [FileType.MANUAL]: { label: 'Manual', color: 'bg-blue-100 text-blue-800' },
      [FileType.DIAGRAM]: { label: 'Diagrama', color: 'bg-purple-100 text-purple-800' },
      [FileType.FLOW]: { label: 'Flujo', color: 'bg-green-100 text-green-800' },
      [FileType.DOCUMENTATION]: { label: 'Doc', color: 'bg-gray-100 text-gray-800' },
      [FileType.ARCHITECTURE]: { label: 'Arq', color: 'bg-orange-100 text-orange-800' },
      [FileType.API_DOCS]: { label: 'API', color: 'bg-indigo-100 text-indigo-800' },
      [FileType.USER_GUIDE]: { label: 'Guía', color: 'bg-pink-100 text-pink-800' },
      [FileType.TECHNICAL_SPEC]: { label: 'Spec', color: 'bg-teal-100 text-teal-800' },
      [FileType.REQUIREMENTS]: { label: 'Req', color: 'bg-red-100 text-red-800' },
      [FileType.DESIGN]: { label: 'Diseño', color: 'bg-yellow-100 text-yellow-800' },
      [FileType.TEST_PLAN]: { label: 'Test', color: 'bg-cyan-100 text-cyan-800' },
      [FileType.DEPLOYMENT_GUIDE]: { label: 'Deploy', color: 'bg-emerald-100 text-emerald-800' },
      [FileType.OTHER]: { label: 'Otro', color: 'bg-gray-100 text-gray-800' }
    }
    const typeInfo = typeMap[type] || { label: type, color: 'bg-gray-100 text-gray-800' }
    return <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
  }

  const latestArchitectureDiagram = getLatestArchitectureDiagram()

  return (
    <>
    <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {/* Top Navigation Bar */}
          <TopNavbar />

          {/* Main Content */}
          <div className="flex-1 space-y-6 p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 text-brand-foreground mx-auto mb-4 animate-spin" />
                  <h2 className="text-xl font-semibold text-muted-foreground mb-2">Cargando proyectos...</h2>
                  <p className="text-muted-foreground">Espera mientras se cargan los datos</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-muted-foreground mb-2">Error al cargar proyectos</h2>
                  <p className="text-muted-foreground">{error}</p>
                </div>
              </div>
            ) : !currentProject ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-muted-foreground mb-2">Selecciona un proyecto</h2>
                  <p className="text-muted-foreground">Elige un proyecto del sidebar para ver sus detalles</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6">
                {/* Información General del Proyecto - with action buttons */}
                <Card className="border-t-2 border-t-primary/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-brand-foreground" />
                        Información General del Proyecto
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <FileText className="mr-2 h-4 w-4" />
                          Exportar
                        </Button>
                        {isAdmin && (
                          <Button size="sm" onClick={() => setEditDialogOpen(true)}>
                            <Target className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Nombre del Proyecto</label>
                          <p className="text-lg font-semibold">{currentProject.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Unidad de Negocio</label>
                          <p className="text-base">{currentProject.businessUnit}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Descripción</label>
                          <p className="text-base text-foreground">{currentProject.description}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Estado Actual</label>
                          <div className="mt-1"><ProjectStatusBadge status={currentProject.status} showIcon /></div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Tecnologías Utilizadas</label>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {currentProject.technologies && currentProject.technologies.length > 0 ? (
                              currentProject.technologies.map((tech, index) => (
                                <Badge key={tech.id} variant="secondary">
                                  {tech.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No especificadas</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                  
                  {/* Repositorios */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <GitBranch className="h-5 w-5" />
                          Repositorios ({currentProject.repositories.length})
                        </CardTitle>
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditRepositoriesDialogOpen(true)}
                          >
                            <Edit3 className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {currentProject.repositories.length > 0 ? (
                        currentProject.repositories.map((repo) => (
                          <div key={repo.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                            <div className="flex items-center gap-3">
                              <GitBranch className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{repo.name}</p>
                                <p className="text-sm text-muted-foreground">{repo.type}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-xs">
                                <GitBranch className="mr-1 h-3 w-3" />
                                {repo.branch}
                              </Badge>
                              <Button variant="ghost" size="sm" asChild>
                                <a href={repo.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <GitBranch className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p>No hay repositorios configurados</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Infraestructura */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Server className="h-5 w-5" />
                          Infraestructura
                        </CardTitle>
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditCloudServicesDialogOpen(true)}
                          >
                            <Edit3 className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <button
                        type="button"
                        className={`relative block w-full overflow-hidden rounded-xl border bg-muted/30 text-left transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                          latestArchitectureDiagram ? "aspect-video" : "min-h-44 border-dashed p-6"
                        } ${latestArchitectureDiagram || isAdmin ? "cursor-pointer hover:border-primary/50 hover:bg-muted/60" : ""}`}
                        onClick={handleArchitectureClick}
                        disabled={!latestArchitectureDiagram && !isAdmin}
                        aria-label={latestArchitectureDiagram ? "Ver diagrama de arquitectura" : isAdmin ? "Subir diagrama de arquitectura" : "Sin diagrama de arquitectura"}
                      >
                        {(() => {
                          const latestDiagram = latestArchitectureDiagram
                          if (latestDiagram) {
                            return (
                              <div className="h-full relative">
                                {latestDiagram.mimetype.startsWith('image/') ? (
                                  <img
                                    src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/files/${latestDiagram.id}`}
                                    alt="Diagrama de Arquitectura"
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      // Si la imagen falla, mostrar el icono
                                      e.currentTarget.style.display = 'none'
                                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                    }}
                                  />
                                ) : null}
                                <div className={`absolute inset-0 flex items-center justify-center ${latestDiagram.mimetype.startsWith('image/') ? 'hidden' : ''}`}>
                                  <div className="text-center text-muted-foreground">
                                    <div className="text-3xl mb-2">{getFileIcon(latestDiagram.mimetype)}</div>
                                    <p className="text-sm font-medium">Diagrama de Arquitectura</p>
                                  </div>
                                </div>
                                {/* Overlay con información */}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2">
                                  <p className="text-xs truncate">{latestDiagram.filename}</p>
                                  <p className="text-xs opacity-75">
                                    {new Date(latestDiagram.uploadedAt).toLocaleDateString('es-ES')}
                                  </p>
                                </div>
                              </div>
                            )
                          } else {
                            return (
                              <div className="flex flex-col items-center justify-center gap-2 text-center">
                                <span className="mb-1 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-brand-foreground">
                                  <Cloud className="size-5" aria-hidden="true" />
                                </span>
                                <p className="text-sm font-medium text-foreground">Diagrama de arquitectura</p>
                                <p className="text-xs text-muted-foreground">
                                  {isAdmin ? "Haz clic para subir una imagen o PDF" : "No hay un diagrama disponible"}
                                </p>
                              </div>
                            )
                          }
                        })()}
                      </button>
                      <div>
                        <h3 className="text-sm font-medium">Servicios Cloud</h3>
                        <div className="mt-2 space-y-2">
                          {currentProject.cloudServices && currentProject.cloudServices.length > 0 ? (
                            currentProject.cloudServices.map((service) => (
                              <div key={service.id} className="flex items-center gap-2 rounded-lg border bg-muted/20 p-3 text-sm">
                                <div className={`size-2 shrink-0 rounded-full ${service.isActive ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-muted-foreground'}`}></div>
                                <div className="flex min-w-0 flex-wrap items-center gap-2">
                                  {getCloudProviderIcon(service.provider)}
                                  <span className="break-words font-medium">{service.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {getCloudProviderLabel(service.provider)}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {service.serviceType}
                                  </Badge>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-xl border bg-muted/20 px-4 py-5 text-center text-muted-foreground">
                              <Cloud className="mx-auto mb-2 size-5" aria-hidden="true" />
                              <p className="text-sm">No hay servicios cloud configurados</p>
                              {isAdmin && <p className="text-xs">Haz clic en &quot;Editar&quot; para agregar servicios</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Entornos y URLs */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        Entornos y URLs
                      </CardTitle>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditEnvironmentsDialogOpen(true)}
                        >
                          <Edit3 className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {currentProject.environments && currentProject.environments.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Entorno</TableHead>
                            <TableHead>URL</TableHead>
                            <TableHead>Descripción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentProject.environments.map((environment) => (
                            <TableRow key={environment.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getEnvironmentTypeIcon(environment.type)}
                                  <Badge variant="outline">{getEnvironmentTypeLabel(environment.type)}</Badge>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                <a 
                                  href={environment.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-brand-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
                                >
                                  {environment.url}
                                  <ExternalLink className="inline h-3 w-3 ml-1" />
                                </a>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {environment.description || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Server className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                        <p>No hay entornos configurados</p>
                          {isAdmin && <p className="text-sm">Haz clic en &quot;Editar&quot; para agregar entornos al proyecto</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Seguridad y Accesos */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Seguridad y Accesos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Tipo de Autenticación</label>
                        <p className="text-base font-medium">SSO (Single Sign-On)</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Roles Definidos</label>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Admin</Badge>
                            <span className="text-sm text-muted-foreground">Acceso completo</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Editor</Badge>
                            <span className="text-sm text-muted-foreground">Lectura y escritura</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Viewer</Badge>
                            <span className="text-sm text-muted-foreground">Solo lectura</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-accent rounded-lg">
                        <p className="text-sm text-accent-foreground">
                          <strong>Para solicitar accesos:</strong> Contactar al equipo de IT mediante ticket en ServiceNow
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Documentación */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Documentación
                        </CardTitle>
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditDocumentsDialogOpen(true)}
                          >
                            <Edit3 className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {currentProject.files && currentProject.files.length > 0 ? (
                        currentProject.files.slice(0, 5).map((file) => (
                          <Button key={file.id} variant="ghost" className="w-full justify-start" asChild>
                            <a 
                              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/files/${file.id}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="flex items-center gap-3"
                            >
                              <span className="text-lg">{FileService.getFileIcon(file.mimetype)}</span>
                              <div className="flex-1 text-left">
                                <div className="font-medium">{file.filename}</div>
                                {file.description && (
                                  <div className="text-xs text-muted-foreground truncate">{file.description}</div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {getDocumentTypeBadge(file.type)}
                                <ExternalLink className="h-3 w-3" />
                              </div>
                            </a>
                          </Button>
                        ))
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm">No hay documentos en el proyecto</p>
                          {isAdmin && <p className="text-xs">Haz clic en &quot;Editar&quot; para agregar documentos</p>}
                        </div>
                      )}
                      {currentProject.files && currentProject.files.length > 5 && (
                        <div className="text-center pt-2">
                          <p className="text-xs text-muted-foreground">
                            Y {currentProject.files.length - 5} documentos más...
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Equipo Responsable */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Equipo Responsable
                      </CardTitle>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditTeamMembersDialogOpen(true)}
                        >
                          <Edit3 className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {currentProject.teamMembers && currentProject.teamMembers.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Rol</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Contacto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentProject.teamMembers.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell>
                                <Badge variant="default">{getRoleBadge(member.role)}</Badge>
                              </TableCell>
                              <TableCell className="font-medium">{member.name}</TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <a
                                    href={`mailto:${member.email}`}
                                    className="flex items-center gap-2 text-brand-foreground underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
                                  >
                                    <Mail className="h-4 w-4" />
                                    {member.email}
                                  </a>
                                  {member.phone && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <Phone className="h-3 w-3" />
                                      <span className="text-sm">{member.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                        <p>No hay miembros del equipo configurados</p>
                        {isAdmin && <p className="text-sm">Haz clic en &quot;Editar&quot; para agregar miembros al equipo</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Roadmap y Tareas */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Roadmap y Tareas
                        </CardTitle>
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditTasksDialogOpen(true)}
                          >
                            <Edit3 className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {currentProject.tasks && currentProject.tasks.length > 0 ? (
                        <div className="space-y-3">
                          {currentProject.tasks.map((task) => (
                            <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <div className="flex items-center gap-3 flex-1">
                                {task.status === 'done' ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : task.status === 'in_progress' ? (
                                  <Clock className="h-4 w-4 text-blue-600" />
                                ) : task.status === 'review' ? (
                                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                )}
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{task.title}</p>
                                  {task.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
                                  )}
                                  {task.dueDate && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Fecha límite: {new Date(task.dueDate).toLocaleDateString('es-ES')}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getPriorityBadge(task.priority)}
                                <Badge variant="secondary">{task.status}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm">No hay tareas configuradas</p>
                          {isAdmin && <p className="text-xs">Haz clic en &quot;Editar&quot; para agregar tareas al proyecto</p>}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Enlaces Útiles */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Link className="h-5 w-5" />
                          Enlaces Útiles
                        </CardTitle>
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditUsefulLinksDialogOpen(true)}
                          >
                            <Edit3 className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {currentProject.usefulLinks && currentProject.usefulLinks.length > 0 ? (
                        currentProject.usefulLinks.map((link) => (
                          <Button key={link.id} variant="ghost" className="w-full justify-start" asChild>
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                              {getLinkIcon(link.type)}
                              <div className="flex-1 text-left">
                                <div className="font-medium">{link.title}</div>
                                {link.description && (
                                  <div className="text-xs text-muted-foreground truncate">{link.description}</div>
                                )}
                              </div>
                              <ExternalLink className="h-3 w-3 ml-auto flex-shrink-0" />
                            </a>
                          </Button>
                        ))
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <Link className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm">No hay enlaces útiles configurados</p>
                          {isAdmin && <p className="text-xs">Haz clic en &quot;Editar&quot; para agregar enlaces al proyecto</p>}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Modal de edición */}
      <EditProjectDialog
        project={currentProject}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleEditProject}
      />

      {/* Modal de edición de repositorios */}
      <EditRepositoriesDialog
        project={currentProject}
        open={editRepositoriesDialogOpen}
        onOpenChange={setEditRepositoriesDialogOpen}
        onSave={handleEditRepositories}
        onProjectUpdate={handleProjectUpdate}
      />

      {/* Modal de edición de miembros del equipo */}
      <EditTeamMembersDialog
        project={currentProject}
        open={editTeamMembersDialogOpen}
        onOpenChange={setEditTeamMembersDialogOpen}
        onSave={handleEditTeamMembers}
        onProjectUpdate={handleProjectUpdate}
      />

      {/* Modal de edición de tareas */}
      <EditTasksDialog
        project={currentProject}
        open={editTasksDialogOpen}
        onOpenChange={setEditTasksDialogOpen}
        onSave={handleEditTasks}
        onProjectUpdate={handleProjectUpdate}
      />

      {/* Modal de edición de enlaces útiles */}
      <EditUsefulLinksDialog
        project={currentProject}
        open={editUsefulLinksDialogOpen}
        onOpenChange={setEditUsefulLinksDialogOpen}
        onSave={handleEditUsefulLinks}
        onProjectUpdate={handleProjectUpdate}
      />

      {/* Modal de edición de entornos */}
      <EditEnvironmentsDialog
        project={currentProject}
        open={editEnvironmentsDialogOpen}
        onOpenChange={setEditEnvironmentsDialogOpen}
        onSave={handleEditEnvironments}
        onProjectUpdate={handleProjectUpdate}
      />

      {/* Modal de edición de documentos */}
      <EditDocumentsDialog
        project={currentProject}
        open={editDocumentsDialogOpen}
        onOpenChange={setEditDocumentsDialogOpen}
        onSave={handleEditDocuments}
        onProjectUpdate={handleProjectUpdate}
      />

      {/* Modal de edición de servicios cloud */}
      {currentProject && (
        <EditCloudServicesDialog
          project={currentProject}
          open={editCloudServicesDialogOpen}
          onOpenChange={setEditCloudServicesDialogOpen}
          onProjectUpdate={handleProjectUpdate}
        />
      )}

      {/* Modal de diagrama de arquitectura */}
      {currentProject && (
        <ArchitectureDiagramDialog
          project={currentProject}
          open={architectureDiagramDialogOpen}
          onOpenChange={setArchitectureDiagramDialogOpen}
          onProjectUpdate={handleProjectUpdate}
        />
      )}

      {/* Modal de visualización de diagrama de arquitectura */}
      {currentProject && (
        <ArchitectureViewerDialog
          project={currentProject}
          open={architectureViewerDialogOpen}
          onOpenChange={setArchitectureViewerDialogOpen}
        />
      )}      
    </>
  )
}
