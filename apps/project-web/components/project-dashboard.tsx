"use client"

import * as React from "react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { TopNavbar } from "./top-navbar"
import { ThemeProvider } from "./theme-provider"
import {
  Github,
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
  Figma,
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
} from "lucide-react"
import { useProjects } from "@/hooks/useProjects"
import { ProjectStatus, Project, FileType } from "@/types/project"
import { FileService } from "@/services/fileService"
import { EditProjectDialog } from "./edit-project-dialog"
import { EditRepositoriesDialog } from "./edit-repositories-dialog"
import { EditTeamMembersDialog } from "./edit-team-members-dialog"
import { EditTasksDialog } from "./edit-tasks-dialog"
import { EditUsefulLinksDialog } from "./edit-useful-links-dialog"
import { EditEnvironmentsDialog } from "./edit-environments-dialog"
import { EditDocumentsDialog } from "./edit-documents-dialog"


export function ProjectDashboard() {
  const { projects, currentProject, setCurrentProject, loading, error, updateProject, updateProjectInList } = useProjects()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editRepositoriesDialogOpen, setEditRepositoriesDialogOpen] = useState(false)
  const [editTeamMembersDialogOpen, setEditTeamMembersDialogOpen] = useState(false)
  const [editTasksDialogOpen, setEditTasksDialogOpen] = useState(false)
  const [editUsefulLinksDialogOpen, setEditUsefulLinksDialogOpen] = useState(false)
  const [editEnvironmentsDialogOpen, setEditEnvironmentsDialogOpen] = useState(false)
  const [editDocumentsDialogOpen, setEditDocumentsDialogOpen] = useState(false)

  // Manejar cambio de proyecto activo
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case ProjectStatus.PRODUCTION:
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        )
      case ProjectStatus.STAGING:
        return (
          <Badge variant="default" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            <Clock className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        )
      case ProjectStatus.DEVELOPMENT:
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <AlertCircle className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
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
      'architect': 'Architect'
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
      'repository': { icon: Github, color: 'text-gray-600' },
      'deployment': { icon: Rocket, color: 'text-orange-600' },
      'testing': { icon: TestTube, color: 'text-red-600' },
      'other': { icon: Globe, color: 'text-gray-600' }
    }
    const iconInfo = iconMap[type] || { icon: Globe, color: 'text-gray-600' }
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
    return <IconComponent className="h-4 w-4 text-gray-600" />
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

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SidebarProvider>
        <AppSidebar activeProject={currentProject?.id} onProjectChange={handleProjectChange} />
        <SidebarInset>
          {/* Top Navigation Bar */}
          <TopNavbar />

          {/* Main Content */}
          <div className="flex-1 space-y-6 p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                  <h2 className="text-xl font-semibold text-gray-600 mb-2">Cargando proyectos...</h2>
                  <p className="text-gray-500">Espera mientras se cargan los datos</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-600 mb-2">Error al cargar proyectos</h2>
                  <p className="text-gray-500">{error}</p>
                </div>
              </div>
            ) : !currentProject ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-600 mb-2">Selecciona un proyecto</h2>
                  <p className="text-gray-500">Elige un proyecto del sidebar para ver sus detalles</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6">
                {/* Información General del Proyecto - with action buttons */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-blue-600" />
                        Información General del Proyecto
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <FileText className="mr-2 h-4 w-4" />
                          Exportar
                        </Button>
                        <Button size="sm" onClick={() => setEditDialogOpen(true)}>
                          <Target className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Nombre del Proyecto</label>
                          <p className="text-lg font-semibold">{currentProject.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Unidad de Negocio</label>
                          <p className="text-base">{currentProject.businessUnit}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Descripción</label>
                          <p className="text-base text-gray-700">{currentProject.description}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Estado Actual</label>
                          <div className="mt-1">{getStatusBadge(currentProject.status)}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Tecnologías Utilizadas</label>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {currentProject.technologies && currentProject.technologies.length > 0 ? (
                              currentProject.technologies.map((tech, index) => (
                                <Badge key={tech.id} variant="secondary">
                                  {tech.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-gray-500">No especificadas</span>
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
                          <Github className="h-5 w-5" />
                          Repositorios ({currentProject.repositories.length})
                        </CardTitle>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditRepositoriesDialogOpen(true)}
                        >
                          <Edit3 className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {currentProject.repositories.length > 0 ? (
                        currentProject.repositories.map((repo) => (
                          <div key={repo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Github className="h-4 w-4 text-gray-600" />
                              <div>
                                <p className="font-medium">{repo.name}</p>
                                <p className="text-sm text-gray-500">{repo.type}</p>
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
                        <div className="text-center py-4 text-gray-500">
                          <Github className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>No hay repositorios configurados</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Infraestructura */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        Infraestructura
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <Cloud className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">Diagrama de Arquitectura</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Servicios Cloud</label>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            AWS EKS - Orquestación de contenedores
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            AWS S3 - Almacenamiento de archivos
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            AWS RDS - Base de datos PostgreSQL
                          </div>
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditEnvironmentsDialogOpen(true)}
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
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
                                  className="text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {environment.url}
                                  <ExternalLink className="inline h-3 w-3 ml-1" />
                                </a>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {environment.description || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Server className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p>No hay entornos configurados</p>
                        <p className="text-sm">Haz clic en &quot;Editar&quot; para agregar entornos al proyecto</p>
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
                        <label className="text-sm font-medium text-gray-500">Tipo de Autenticación</label>
                        <p className="text-base font-medium">SSO (Single Sign-On)</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Roles Definidos</label>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Admin</Badge>
                            <span className="text-sm text-gray-600">Acceso completo</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Editor</Badge>
                            <span className="text-sm text-gray-600">Lectura y escritura</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Viewer</Badge>
                            <span className="text-sm text-gray-600">Solo lectura</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditDocumentsDialogOpen(true)}
                        >
                          <Edit3 className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {currentProject.files && currentProject.files.length > 0 ? (
                        currentProject.files.slice(0, 5).map((file) => (
                          <Button key={file.id} variant="ghost" className="w-full justify-start" asChild>
                            <a 
                              href={`/api/files/${file.id}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="flex items-center gap-3"
                            >
                              <span className="text-lg">{FileService.getFileIcon(file.mimetype)}</span>
                              <div className="flex-1 text-left">
                                <div className="font-medium">{file.filename}</div>
                                {file.description && (
                                  <div className="text-xs text-gray-500 truncate">{file.description}</div>
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
                        <div className="text-center py-6 text-gray-500">
                          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">No hay documentos en el proyecto</p>
                          <p className="text-xs">Haz clic en &quot;Editar&quot; para agregar documentos</p>
                        </div>
                      )}
                      {currentProject.files && currentProject.files.length > 5 && (
                        <div className="text-center pt-2">
                          <p className="text-xs text-gray-500">
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditTeamMembersDialogOpen(true)}
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
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
                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                                  >
                                    <Mail className="h-4 w-4" />
                                    {member.email}
                                  </a>
                                  {member.phone && (
                                    <div className="flex items-center gap-2 text-gray-600">
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
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p>No hay miembros del equipo configurados</p>
                        <p className="text-sm">Haz clic en &quot;Editar&quot; para agregar miembros al equipo</p>
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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditTasksDialogOpen(true)}
                        >
                          <Edit3 className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
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
                                  <AlertCircle className="h-4 w-4 text-gray-600" />
                                )}
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{task.title}</p>
                                  {task.description && (
                                    <p className="text-xs text-gray-600 mt-1 line-clamp-1">{task.description}</p>
                                  )}
                                  {task.dueDate && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Fecha límite: {new Date(task.dueDate).toLocaleDateString('es-ES')}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getPriorityBadge(task.priority)}
                                {getStatusBadge(task.status)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">No hay tareas configuradas</p>
                          <p className="text-xs">Haz clic en &quot;Editar&quot; para agregar tareas al proyecto</p>
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
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditUsefulLinksDialogOpen(true)}
                        >
                          <Edit3 className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
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
                                  <div className="text-xs text-gray-500 truncate">{link.description}</div>
                                )}
                              </div>
                              <ExternalLink className="h-3 w-3 ml-auto flex-shrink-0" />
                            </a>
                          </Button>
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          <Link className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm">No hay enlaces útiles configurados</p>
                          <p className="text-xs">Haz clic en &quot;Editar&quot; para agregar enlaces al proyecto</p>
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
    </ThemeProvider>
  )
}
