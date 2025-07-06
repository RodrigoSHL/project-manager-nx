'use client'
import { useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { useProjects } from "@/hooks/useProjects"
import { ProjectStatus } from "@/types/project"
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
  RefreshCw,
} from "lucide-react"

export function ProjectDashboard() {
  const {
    projects,
    currentProject,
    stats,
    loading,
    error,
    getAllProjects,
    getProjectStats,
    runSeed,
    clearError,
  } = useProjects()

  useEffect(() => {
    getAllProjects()
    getProjectStats()
  }, [getAllProjects, getProjectStats])

  // Usar el primer proyecto como ejemplo, o datos por defecto
  const project = currentProject || projects[0] || {
    name: "Sistema de Gestión Empresarial",
    businessUnit: "Tecnología e Innovación",
    description: "Plataforma integral para la gestión de recursos empresariales con módulos de facturación, inventario y reportes analíticos en tiempo real.",
    status: ProjectStatus.PRODUCTION,
    technologies: [
      { name: "React", category: "Frontend" },
      { name: "Next.js", category: "Frontend" },
      { name: "TypeScript", category: "Language" },
      { name: "PostgreSQL", category: "Database" },
      { name: "Docker", category: "DevOps" },
      { name: "AWS", category: "Cloud" },
    ],
    repositories: [
      {
        id: "1",
        name: "empresa/sistema-gestion",
        url: "https://github.com/empresa/sistema-gestion",
        type: "GitHub",
        isMain: true,
        branch: "main",
      }
    ],
    environments: [
      {
        id: "1",
        name: "Local",
        url: "localhost:3000",
        type: "development",
        description: "Desarrollo local",
        isActive: true,
      },
      {
        id: "2",
        name: "Staging",
        url: "staging.empresa.com",
        type: "staging",
        description: "Pruebas y QA",
        isActive: true,
      },
      {
        id: "3",
        name: "Producción",
        url: "app.empresa.com",
        type: "production",
        description: "Entorno productivo",
        isActive: true,
      }
    ],
    teamMembers: [
      {
        id: "1",
        name: "Ana García",
        email: "ana.garcia@empresa.com",
        role: "Tech Lead",
        isActive: true,
      },
      {
        id: "2",
        name: "Carlos Ruiz",
        email: "carlos.ruiz@empresa.com",
        role: "DevOps",
        isActive: true,
      },
      {
        id: "3",
        name: "María López",
        email: "maria.lopez@empresa.com",
        role: "Product Owner",
        isActive: true,
      }
    ],
    tasks: [
      {
        id: "1",
        title: "Migración a AWS EKS",
        status: "pending",
        priority: "high",
        dueDate: new Date("2024-03-15"),
      },
      {
        id: "2",
        title: "Implementar autenticación 2FA",
        status: "in_progress",
        priority: "medium",
        dueDate: new Date("2024-03-30"),
      },
      {
        id: "3",
        title: "Optimización de consultas DB",
        status: "completed",
        priority: "low",
        dueDate: new Date("2024-04-10"),
      }
    ],
    cloudServices: [
      {
        id: "1",
        name: "AWS EKS",
        provider: "AWS",
        service: "EKS",
        description: "Orquestación de contenedores",
        isActive: true,
      },
      {
        id: "2",
        name: "AWS S3",
        provider: "AWS",
        service: "S3",
        description: "Almacenamiento de archivos",
        isActive: true,
      },
      {
        id: "3",
        name: "AWS RDS",
        provider: "AWS",
        service: "RDS",
        description: "Base de datos PostgreSQL",
        isActive: true,
      }
    ],
    usefulLinks: [
      {
        id: "1",
        title: "Diseños en Figma",
        url: "#",
        category: "design",
      },
      {
        id: "2",
        title: "Confluence - Wiki del Proyecto",
        url: "#",
        category: "documentation",
      },
      {
        id: "3",
        title: "Canal de Soporte - Slack",
        url: "#",
        category: "communication",
      },
      {
        id: "4",
        title: "Monitoreo - Grafana",
        url: "#",
        category: "monitoring",
      }
    ],
    authenticationType: "SSO (Single Sign-On)",
    accessInstructions: "Para solicitar accesos: Contactar al equipo de IT mediante ticket en ServiceNow",
  }

  const getStatusBadge = (status: ProjectStatus) => {
    const statusConfig = {
      [ProjectStatus.PLANNING]: { variant: "outline" as const, text: "Planificación", className: "" },
      [ProjectStatus.DEVELOPMENT]: { variant: "secondary" as const, text: "Desarrollo", className: "" },
      [ProjectStatus.TESTING]: { variant: "secondary" as const, text: "Pruebas", className: "" },
      [ProjectStatus.STAGING]: { variant: "secondary" as const, text: "Staging", className: "" },
      [ProjectStatus.PRODUCTION]: { variant: "default" as const, text: "En Producción", className: "bg-green-100 text-green-800 hover:bg-green-100" },
      [ProjectStatus.MAINTENANCE]: { variant: "outline" as const, text: "Mantenimiento", className: "" },
      [ProjectStatus.DEPRECATED]: { variant: "destructive" as const, text: "Deprecado", className: "" },
    }
    
    const config = statusConfig[status]
    return (
      <Badge variant={config.variant} className={config.className}>
        {status === ProjectStatus.PRODUCTION && <CheckCircle className="mr-1 h-3 w-3" />}
        {config.text}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { variant: "outline" as const, text: "Baja" },
      medium: { variant: "secondary" as const, text: "Media" },
      high: { variant: "destructive" as const, text: "Alta" },
      critical: { variant: "destructive" as const, text: "Crítica" },
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium
    return <Badge variant={config.variant} className="text-xs">{config.text}</Badge>
  }

  const getTaskIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getTaskBgColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50'
      case 'in_progress':
        return 'bg-yellow-50'
      default:
        return 'bg-red-50'
    }
  }

  if (loading && projects.length === 0) {
    return <LoadingSpinner text="Cargando proyectos..." />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/50 p-6">
        <ErrorMessage message={error} onDismiss={clearError} />
        <div className="mt-4 flex gap-2">
          <Button onClick={getAllProjects} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
          <Button onClick={runSeed} variant="outline">
            Ejecutar Seed
          </Button>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Gestión de Proyectos</h1>
              <p className="mt-2 text-lg text-gray-600">Resumen técnico y operativo de cada proyecto</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={runSeed} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {loading ? "Ejecutando..." : "Ejecutar Seed"}
              </Button>
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Exportar
              </Button>
              <Button>
                <Target className="mr-2 h-4 w-4" />
                Nuevo Proyecto
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-6">
          {/* Información General del Proyecto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Información General del Proyecto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nombre del Proyecto</label>
                    <p className="text-lg font-semibold">{project.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Unidad de Negocio</label>
                    <p className="text-base">{project.businessUnit}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Descripción</label>
                    <p className="text-base text-gray-700">
                      {project.description}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estado Actual</label>
                    <div className="mt-1">
                      {getStatusBadge(project.status)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tecnologías Utilizadas</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {project.technologies?.map((tech) => (
                        <Badge key={tech.id || tech.name} variant="secondary">
                          {tech.name}
                        </Badge>
                      )) || (
                        <>
                          <Badge variant="secondary">React</Badge>
                          <Badge variant="secondary">Next.js</Badge>
                          <Badge variant="secondary">TypeScript</Badge>
                          <Badge variant="secondary">PostgreSQL</Badge>
                          <Badge variant="secondary">Docker</Badge>
                          <Badge variant="secondary">AWS</Badge>
                        </>
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
                  Repositorios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.repositories?.map((repo) => (
                  <div key={repo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Github className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="font-medium">{repo.name || "Repositorio sin nombre"}</p>
                        <p className="text-sm text-gray-500">
                          {repo.isMain ? "Repositorio principal" : "Repositorio secundario"}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={repo.url || "#"} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                )) || (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Github className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="font-medium">empresa/sistema-gestion</p>
                        <p className="text-sm text-gray-500">Repositorio principal</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Branch Principal:</span>
                    <Badge variant="outline" className="font-mono">
                      <GitBranch className="mr-1 h-3 w-3" />
                      {project.mainBranch || "main"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Último Despliegue:</span>
                    <div className="text-right">
                      <p className="text-sm font-mono">{project.lastDeployment || "v2.1.3"}</p>
                      <p className="text-xs text-gray-500">
                        {project.lastDeploymentDate ? 
                          `hace ${Math.floor((Date.now() - new Date(project.lastDeploymentDate).getTime()) / (1000 * 60 * 60 * 24))} días` : 
                          "hace 2 días"
                        }
                      </p>
                    </div>
                  </div>
                </div>
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
                    {project.cloudServices?.map((service, index) => (
                      <div key={service.id} className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${
                          index === 0 ? 'bg-orange-500' : 
                          index === 1 ? 'bg-blue-500' : 
                          index === 2 ? 'bg-green-500' : 'bg-gray-500'
                        }`}></div>
                        {service.provider || "Proveedor"} {service.service || "Servicio"} - {service.description || "Sin descripción"}
                      </div>
                    )) || (
                      <>
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
                      </>
                    )}
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
                  {project.environments?.map((env) => (
                    <TableRow key={env.id}>
                      <TableCell>
                        <Badge 
                          variant={env.type === 'production' ? 'default' : env.type === 'staging' ? 'secondary' : 'outline'}
                          className={env.type === 'production' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                        >
                          {env.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <a href={env.url.startsWith('http') ? env.url : `http://${env.url}`} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="text-blue-600 hover:text-blue-800">
                          {env.url}
                        </a>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{env.description}</TableCell>
                    </TableRow>
                  )) || (
                    <>
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
                    </>
                  )}
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
                  <p className="text-base font-medium">{project.authenticationType || "SSO (Single Sign-On)"}</p>
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
                    <strong>Para solicitar accesos:</strong> {project.accessInstructions || "Contactar al equipo de IT mediante ticket en ServiceNow"}
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
                  {project.teamMembers?.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                                              <Badge 
                        variant={
                          member.role?.toLowerCase().includes('lead') ? 'default' : 
                          member.role?.toLowerCase().includes('devops') ? 'secondary' : 'outline'
                        }
                      >
                        {member.role || "Sin rol"}
                      </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{member.name || "Sin nombre"}</TableCell>
                      <TableCell>
                        <a
                          href={`mailto:${member.email || ""}`}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                        >
                          <Mail className="h-4 w-4" />
                          {member.email || "Sin email"}
                        </a>
                      </TableCell>
                    </TableRow>
                  )) || (
                    <>
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
                    </>
                  )}
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
                  {project.tasks?.map((task) => (
                    <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg ${getTaskBgColor(task.status)}`}>
                      {getTaskIcon(task.status)}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{task.title || "Tarea sin título"}</p>
                        <p className="text-xs text-gray-600">
                          {task.dueDate ? `Fecha límite: ${new Date(task.dueDate).toLocaleDateString('es-ES', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}` : 'Sin fecha límite'}
                        </p>
                      </div>
                      {getPriorityBadge(task.priority || 'medium')}
                    </div>
                  )) || (
                    <>
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
                    </>
                  )}
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
                {project.usefulLinks?.map((link) => {
                  const getIcon = (category?: string) => {
                    switch (category?.toLowerCase()) {
                      case 'design':
                        return <Figma className="h-4 w-4 text-purple-600" />
                      case 'documentation':
                        return <FileText className="h-4 w-4 text-blue-600" />
                      case 'communication':
                        return <MessageSquare className="h-4 w-4 text-green-600" />
                      case 'monitoring':
                        return <Database className="h-4 w-4 text-orange-600" />
                      default:
                        return <Link className="h-4 w-4 text-gray-600" />
                    }
                  }

                  return (
                    <Button key={link.id} variant="ghost" className="w-full justify-start" asChild>
                      <a href={link.url || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3">
                        {getIcon(link.category)}
                        {link.title || "Enlace sin título"}
                        <ExternalLink className="h-3 w-3 ml-auto" />
                      </a>
                    </Button>
                  )
                }) || (
                  <>
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
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
