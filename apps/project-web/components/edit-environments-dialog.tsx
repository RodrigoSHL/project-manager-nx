"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Server, 
  ExternalLink, 
  Home, 
  Code, 
  TestTube, 
  Rocket, 
  Database, 
  Plus, 
  Trash2, 
  Edit3,
  Save,
  X,
  Globe
} from "lucide-react"
import { Environment, Project } from "@/types/project"
import { ProjectService } from "@/services/projectService"

interface EditEnvironmentsDialogProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (project: Project) => void
  onProjectUpdate?: (updatedProject: Project) => void
}

interface EnvironmentFormData {
  type: string
  url: string
  description: string
}

const ENVIRONMENT_TYPES = [
  { value: 'local', label: 'Local', icon: Home, color: 'bg-gray-100 text-gray-800' },
  { value: 'development', label: 'Desarrollo', icon: Code, color: 'bg-blue-100 text-blue-800' },
  { value: 'testing', label: 'Testing', icon: TestTube, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'staging', label: 'Staging', icon: Database, color: 'bg-orange-100 text-orange-800' },
  { value: 'production', label: 'Producción', icon: Rocket, color: 'bg-green-100 text-green-800' }
]

export function EditEnvironmentsDialog({
  project,
  open,
  onOpenChange,
  onSave,
  onProjectUpdate
}: EditEnvironmentsDialogProps) {
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [editingEnvironment, setEditingEnvironment] = useState<string | null>(null)
  const [formData, setFormData] = useState<EnvironmentFormData>({
    type: '',
    url: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)

  // Inicializar entornos cuando se abre el modal
  React.useEffect(() => {
    if (open && project) {
      setEnvironments([...project.environments])
    }
  }, [open, project])

  const handleAddEnvironment = () => {
    if (!formData.type || !formData.url) return

    const newEnvironment: Environment = {
      id: `temp-${Date.now()}`, // ID temporal para el frontend
      type: formData.type,
      url: formData.url,
      description: formData.description,
      name: formData.type, // Usar el tipo como nombre por defecto
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setEnvironments([...environments, newEnvironment])
    setFormData({
      type: '',
      url: '',
      description: ''
    })
  }

  const handleEditEnvironment = (environment: Environment) => {
    setEditingEnvironment(environment.id)
    setFormData({
      type: environment.type,
      url: environment.url,
      description: environment.description || ''
    })
  }

  const handleUpdateEnvironment = () => {
    if (!editingEnvironment || !formData.type || !formData.url) return

    setEnvironments(envs => 
      envs.map(env => 
        env.id === editingEnvironment 
          ? { 
              ...env, 
              type: formData.type,
              url: formData.url,
              description: formData.description,
              name: formData.type,
              updatedAt: new Date()
            }
          : env
      )
    )

    setEditingEnvironment(null)
    setFormData({
      type: '',
      url: '',
      description: ''
    })
  }

  const handleDeleteEnvironment = (environmentId: string) => {
    setEnvironments(envs => envs.filter(env => env.id !== environmentId))
  }

  const handleSave = async () => {
    if (!project) return

    setLoading(true)
    try {
      // Preparar datos para la actualización granular
      const updateData = {
        environments: {
          add: environments
            .filter(env => env.id.startsWith('temp-'))
            .map(env => ({
              type: env.type,
              url: env.url,
              description: env.description
            })), // Solo propiedades válidas para nuevos entornos
          update: environments
            .filter(env => !env.id.startsWith('temp-'))
            .map(env => ({
              id: env.id,
              type: env.type,
              url: env.url,
              description: env.description
            })), // Solo propiedades válidas para entornos existentes
          delete: project.environments
            .filter(originalEnv => !environments.find(env => env.id === originalEnv.id))
            .map(env => env.id) // IDs de entornos eliminados
        }
      }

      const updatedProject = await ProjectService.granularUpdateProject(project.id, updateData)
      
      // Actualizar el estado local directamente sin usar el hook updateProject
      if (onProjectUpdate) {
        onProjectUpdate(updatedProject)
      }
      
      onSave(updatedProject)
      onOpenChange(false)
    } catch (error) {
      console.error('Error al guardar entornos:', error)
      alert('Error al guardar los entornos. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditingEnvironment(null)
    setFormData({
      type: '',
      url: '',
      description: ''
    })
    if (project) {
      setEnvironments([...project.environments])
    }
  }

  const getTypeBadge = (type: string) => {
    const typeInfo = ENVIRONMENT_TYPES.find(t => t.value === type)
    return typeInfo ? (
      <Badge className={typeInfo.color}>
        {typeInfo.label}
      </Badge>
    ) : (
      <Badge variant="secondary">{type}</Badge>
    )
  }

  const getTypeIcon = (type: string) => {
    const typeInfo = ENVIRONMENT_TYPES.find(t => t.value === type)
    const IconComponent = typeInfo ? typeInfo.icon : Globe
    return <IconComponent className="h-4 w-4" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Gestionar Entornos
          </DialogTitle>
          <DialogDescription>
            Agrega, edita o elimina entornos del proyecto {project?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          {/* Formulario para agregar/editar entorno */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {editingEnvironment ? 'Editar Entorno' : 'Agregar Nuevo Entorno'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Entorno *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo de entorno" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENVIRONMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL del Entorno *</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://dev.example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del entorno y su propósito..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                {editingEnvironment ? (
                  <>
                    <Button onClick={handleUpdateEnvironment} disabled={!formData.type || !formData.url}>
                      <Save className="mr-2 h-4 w-4" />
                      Actualizar
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleAddEnvironment} disabled={!formData.type || !formData.url}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Entorno
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de entornos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Entornos ({environments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {environments.length > 0 ? (
                environments.map((environment) => (
                  <div key={environment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {getTypeIcon(environment.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-base">{environment.name || environment.type}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <ExternalLink className="h-3 w-3 text-gray-500" />
                          <p className="text-sm text-gray-500 truncate">{environment.url}</p>
                        </div>
                        {environment.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{environment.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {getTypeBadge(environment.type)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditEnvironment(environment)}
                        disabled={editingEnvironment === environment.id}
                        className="hover:bg-blue-50"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEnvironment(environment.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Server className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No hay entornos configurados</p>
                  <p className="text-sm">Agrega tu primer entorno usando el formulario de arriba</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 