"use client"

import * as React from "react"
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
} from "lucide-react"
import { useProjects } from "@/hooks/useProjects"
import { ProjectStatus } from "@/types/project"


export function ProjectDashboard() {
  const { projects, currentProject, setCurrentProject, loading, error } = useProjects()

  // Manejar cambio de proyecto activo
  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      setCurrentProject(project)
    }
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
                        <Button size="sm">
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
                      <CardTitle className="flex items-center gap-2">
                        <Github className="h-5 w-5" />
                        Repositorios ({currentProject.repositories.length})
                      </CardTitle>
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
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="h-5 w-5" />
                      Entornos y URLs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Entorno</TableHead>
                          <TableHead>URL</TableHead>
                          <TableHead>Observaciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <Badge variant="outline">Local</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">localhost:3000</TableCell>
                          <TableCell className="text-sm text-gray-600">Desarrollo local</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <Badge variant="secondary">Staging</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">staging.empresa.com</TableCell>
                          <TableCell className="text-sm text-gray-600">Pruebas y QA</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Producción</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">app.empresa.com</TableCell>
                          <TableCell className="text-sm text-gray-600">Entorno productivo</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
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
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Documentación
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <a href="#" className="flex items-center gap-3">
                          <BookOpen className="h-4 w-4" />
                          Manual de Despliegue
                          <ExternalLink className="h-3 w-3 ml-auto" />
                        </a>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <a href="#" className="flex items-center gap-3">
                          <Users className="h-4 w-4" />
                          Guía de Onboarding
                          <ExternalLink className="h-3 w-3 ml-auto" />
                        </a>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <a href="#" className="flex items-center gap-3">
                          <FileText className="h-4 w-4" />
                          Documentación Técnica
                          <ExternalLink className="h-3 w-3 ml-auto" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Equipo Responsable */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Equipo Responsable
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rol</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Contacto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <Badge variant="default">Tech Lead</Badge>
                          </TableCell>
                          <TableCell className="font-medium">Ana García</TableCell>
                          <TableCell>
                            <a
                              href="mailto:ana.garcia@empresa.com"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                            >
                              <Mail className="h-4 w-4" />
                              ana.garcia@empresa.com
                            </a>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <Badge variant="secondary">DevOps</Badge>
                          </TableCell>
                          <TableCell className="font-medium">Carlos Ruiz</TableCell>
                          <TableCell>
                            <a
                              href="mailto:carlos.ruiz@empresa.com"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                            >
                              <Mail className="h-4 w-4" />
                              carlos.ruiz@empresa.com
                            </a>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <Badge variant="outline">Product Owner</Badge>
                          </TableCell>
                          <TableCell className="font-medium">María López</TableCell>
                          <TableCell>
                            <a
                              href="mailto:maria.lopez@empresa.com"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                            >
                              <Mail className="h-4 w-4" />
                              maria.lopez@empresa.com
                            </a>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Roadmap y Tareas */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Roadmap y Tareas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">Migración a AWS EKS</p>
                            <p className="text-xs text-gray-600">Fecha límite: 15 Mar 2024</p>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            Alta
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">Implementar autenticación 2FA</p>
                            <p className="text-xs text-gray-600">Fecha límite: 30 Mar 2024</p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            Media
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">Optimización de consultas DB</p>
                            <p className="text-xs text-gray-600">Fecha límite: 10 Abr 2024</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Baja
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enlaces Útiles */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Link className="h-5 w-5" />
                        Enlaces Útiles
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <a href="#" className="flex items-center gap-3">
                          <Figma className="h-4 w-4 text-purple-600" />
                          Diseños en Figma
                          <ExternalLink className="h-3 w-3 ml-auto" />
                        </a>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <a href="#" className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-blue-600" />
                          Confluence - Wiki del Proyecto
                          <ExternalLink className="h-3 w-3 ml-auto" />
                        </a>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <a href="#" className="flex items-center gap-3">
                          <MessageSquare className="h-4 w-4 text-green-600" />
                          Canal de Soporte - Slack
                          <ExternalLink className="h-3 w-3 ml-auto" />
                        </a>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" asChild>
                        <a href="#" className="flex items-center gap-3">
                          <Database className="h-4 w-4 text-orange-600" />
                          Monitoreo - Grafana
                          <ExternalLink className="h-3 w-3 ml-auto" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  )
}
