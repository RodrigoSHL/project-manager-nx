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
  Link, 
  ExternalLink, 
  FileText, 
  Palette, 
  Activity, 
  MessageSquare, 
  Github, 
  Rocket, 
  TestTube, 
  Plus, 
  Trash2, 
  Edit3,
  Save,
  X,
  Globe
} from "lucide-react"
import { UsefulLink, Project } from "@/types/project"
import { ProjectService } from "@/services/projectService"

interface EditUsefulLinksDialogProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (project: Project) => void
  onProjectUpdate?: (updatedProject: Project) => void
}

interface UsefulLinkFormData {
  title: string
  url: string
  type: string
  description: string
}

const LINK_TYPES = [
  { value: 'documentation', label: 'Documentación', icon: FileText, color: 'bg-blue-100 text-blue-800' },
  { value: 'design', label: 'Diseño', icon: Palette, color: 'bg-purple-100 text-purple-800' },
  { value: 'monitoring', label: 'Monitoreo', icon: Activity, color: 'bg-green-100 text-green-800' },
  { value: 'communication', label: 'Comunicación', icon: MessageSquare, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'repository', label: 'Repositorio', icon: Github, color: 'bg-gray-100 text-gray-800' },
  { value: 'deployment', label: 'Despliegue', icon: Rocket, color: 'bg-orange-100 text-orange-800' },
  { value: 'testing', label: 'Testing', icon: TestTube, color: 'bg-red-100 text-red-800' },
  { value: 'other', label: 'Otro', icon: Globe, color: 'bg-gray-100 text-gray-800' }
]

export function EditUsefulLinksDialog({
  project,
  open,
  onOpenChange,
  onSave,
  onProjectUpdate
}: EditUsefulLinksDialogProps) {
  const [usefulLinks, setUsefulLinks] = useState<UsefulLink[]>([])
  const [editingLink, setEditingLink] = useState<string | null>(null)
  const [formData, setFormData] = useState<UsefulLinkFormData>({
    title: '',
    url: '',
    type: '',
    description: ''
  })
  const [loading, setLoading] = useState(false)

  // Inicializar enlaces útiles cuando se abre el modal
  React.useEffect(() => {
    if (open && project) {
      setUsefulLinks([...project.usefulLinks])
    }
  }, [open, project])

  const handleAddUsefulLink = () => {
    if (!formData.title || !formData.url || !formData.type) return

    const newLink: UsefulLink = {
      id: `temp-${Date.now()}`, // ID temporal para el frontend
      title: formData.title,
      url: formData.url,
      type: formData.type,
      description: formData.description,
      category: formData.type,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setUsefulLinks([...usefulLinks, newLink])
    setFormData({
      title: '',
      url: '',
      type: '',
      description: ''
    })
  }

  const handleEditUsefulLink = (link: UsefulLink) => {
    setEditingLink(link.id)
    setFormData({
      title: link.title,
      url: link.url,
      type: link.type,
      description: link.description || ''
    })
  }

  const handleUpdateUsefulLink = () => {
    if (!editingLink || !formData.title || !formData.url || !formData.type) return

    setUsefulLinks(links => 
      links.map(link => 
        link.id === editingLink 
          ? { 
              ...link, 
              title: formData.title,
              url: formData.url,
              type: formData.type,
              description: formData.description,
              category: formData.type,
              updatedAt: new Date()
            }
          : link
      )
    )

    setEditingLink(null)
    setFormData({
      title: '',
      url: '',
      type: '',
      description: ''
    })
  }

  const handleDeleteUsefulLink = (linkId: string) => {
    setUsefulLinks(links => links.filter(link => link.id !== linkId))
  }

  const handleSave = async () => {
    if (!project) return

    setLoading(true)
    try {
      // Preparar datos para la actualización granular
      const updateData = {
        usefulLinks: {
          add: usefulLinks
            .filter(link => link.id.startsWith('temp-'))
            .map(link => ({
              title: link.title,
              url: link.url,
              type: link.type,
              description: link.description
            })), // Solo propiedades válidas para nuevos enlaces
          update: usefulLinks
            .filter(link => !link.id.startsWith('temp-'))
            .map(link => ({
              id: link.id,
              title: link.title,
              url: link.url,
              type: link.type,
              description: link.description
            })), // Solo propiedades válidas para enlaces existentes
          delete: project.usefulLinks
            .filter(originalLink => !usefulLinks.find(link => link.id === originalLink.id))
            .map(link => link.id) // IDs de enlaces eliminados
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
      console.error('Error al guardar enlaces útiles:', error)
      alert('Error al guardar los enlaces útiles. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditingLink(null)
    setFormData({
      title: '',
      url: '',
      type: '',
      description: ''
    })
    if (project) {
      setUsefulLinks([...project.usefulLinks])
    }
  }

  const getTypeBadge = (type: string) => {
    const typeInfo = LINK_TYPES.find(t => t.value === type)
    return typeInfo ? (
      <Badge className={typeInfo.color}>
        {typeInfo.label}
      </Badge>
    ) : (
      <Badge variant="secondary">{type}</Badge>
    )
  }

  const getTypeIcon = (type: string) => {
    const typeInfo = LINK_TYPES.find(t => t.value === type)
    const IconComponent = typeInfo ? typeInfo.icon : Globe
    return <IconComponent className="h-4 w-4" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Gestionar Enlaces Útiles
          </DialogTitle>
          <DialogDescription>
            Agrega, edita o elimina enlaces útiles del proyecto {project?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          {/* Formulario para agregar/editar enlace */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {editingLink ? 'Editar Enlace' : 'Agregar Nuevo Enlace'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título del Enlace *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Documentación de la API"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL del Enlace *</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://docs.example.com/api"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Enlace *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {LINK_TYPES.map((type) => (
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
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del enlace y su propósito..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                {editingLink ? (
                  <>
                    <Button onClick={handleUpdateUsefulLink} disabled={!formData.title || !formData.url || !formData.type}>
                      <Save className="mr-2 h-4 w-4" />
                      Actualizar
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleAddUsefulLink} disabled={!formData.title || !formData.url || !formData.type}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Enlace
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de enlaces útiles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Enlaces Útiles ({usefulLinks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {usefulLinks.length > 0 ? (
                usefulLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {getTypeIcon(link.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-base">{link.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <ExternalLink className="h-3 w-3 text-gray-500" />
                          <p className="text-sm text-gray-500 truncate">{link.url}</p>
                        </div>
                        {link.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{link.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {getTypeBadge(link.type)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUsefulLink(link)}
                        disabled={editingLink === link.id}
                        className="hover:bg-blue-50"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUsefulLink(link.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Link className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No hay enlaces útiles configurados</p>
                  <p className="text-sm">Agrega tu primer enlace usando el formulario de arriba</p>
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