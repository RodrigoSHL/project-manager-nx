"use client"

import * as React from "react"
import { useState, useEffect } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { Project, ProjectStatus } from "@/types/project"
import { ProjectService } from "@/services/projectService"

interface Technology {
  id: string
  name: string
  version?: string
  category: string
  description?: string
}

interface EditProjectDialogProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updatedProject: Partial<Project>) => Promise<void>
}

export function EditProjectDialog({ project, open, onOpenChange, onSave }: EditProjectDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    businessUnit: "",
    description: "",
    status: ProjectStatus.DEVELOPMENT,
  })
  const [selectedTechnologies, setSelectedTechnologies] = useState<Technology[]>([])
  const [availableTechnologies, setAvailableTechnologies] = useState<Technology[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Cargar tecnologías disponibles
  useEffect(() => {
    if (open) {
      loadTechnologies()
    }
  }, [open])

  // Actualizar formulario cuando cambie el proyecto
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        businessUnit: project.businessUnit || "",
        description: project.description || "",
        status: project.status || ProjectStatus.DEVELOPMENT,
      })
      setSelectedTechnologies(project.technologies || [])
    }
  }, [project])

  const loadTechnologies = async () => {
    try {
      setLoading(true)
      const technologies = await ProjectService.getAllTechnologies()
      setAvailableTechnologies(technologies)
    } catch (error) {
      console.error('Error cargando tecnologías:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addTechnology = (technology: Technology) => {
    if (!selectedTechnologies.find(t => t.id === technology.id)) {
      setSelectedTechnologies(prev => [...prev, technology])
    }
  }

  const removeTechnology = (technologyId: string) => {
    setSelectedTechnologies(prev => prev.filter(t => t.id !== technologyId))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const updatedProject = {
        ...formData,
        technologyIds: selectedTechnologies.map(t => t.id)
      }
      await onSave(updatedProject)
      onOpenChange(false)
    } catch (error) {
      console.error('Error guardando proyecto:', error)
    } finally {
      setSaving(false)
    }
  }

  const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.PRODUCTION:
        return "Producción"
      case ProjectStatus.STAGING:
        return "Staging"
      case ProjectStatus.DEVELOPMENT:
        return "Desarrollo"
      case ProjectStatus.TESTING:
        return "Testing"
      case ProjectStatus.PLANNING:
        return "Planificación"
      case ProjectStatus.MAINTENANCE:
        return "Mantenimiento"
      case ProjectStatus.DEPRECATED:
        return "Deprecado"
      default:
        return status
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Proyecto</DialogTitle>
          <DialogDescription>
            Modifica la información básica del proyecto. Los cambios se guardarán automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Nombre del Proyecto */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre del Proyecto
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="col-span-3"
              placeholder="Ingresa el nombre del proyecto"
            />
          </div>

          {/* Unidad de Negocio */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="businessUnit" className="text-right">
              Unidad de Negocio
            </Label>
            <Input
              id="businessUnit"
              value={formData.businessUnit}
              onChange={(e) => handleInputChange('businessUnit', e.target.value)}
              className="col-span-3"
              placeholder="Ingresa la unidad de negocio"
            />
          </div>

          {/* Descripción */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="col-span-3"
              placeholder="Describe el proyecto"
              rows={3}
            />
          </div>

          {/* Estado Actual */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Estado Actual
            </Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona el estado" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ProjectStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {getStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tecnologías Utilizadas */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">
              Tecnologías Utilizadas
            </Label>
            <div className="col-span-3 space-y-3">
              {/* Tecnologías seleccionadas */}
              <div className="flex flex-wrap gap-2">
                {selectedTechnologies.map((tech) => (
                  <Badge key={tech.id} variant="secondary" className="flex items-center gap-1">
                    {tech.name}
                    <button
                      type="button"
                      onClick={() => removeTechnology(tech.id)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {/* Selector de tecnologías */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Agregar tecnología:</Label>
                <Select onValueChange={(value) => {
                  const tech = availableTechnologies.find(t => t.id === value)
                  if (tech) addTechnology(tech)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una tecnología" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTechnologies
                      .filter(tech => !selectedTechnologies.find(t => t.id === tech.id))
                      .map((tech) => (
                        <SelectItem key={tech.id} value={tech.id}>
                          <div className="flex items-center gap-2">
                            <span>{tech.name}</span>
                            {tech.version && (
                              <span className="text-xs text-gray-500">v{tech.version}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 