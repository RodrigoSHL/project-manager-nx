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
  Github, 
  ExternalLink, 
  GitBranch, 
  Plus, 
  Trash2, 
  Edit3,
  Save,
  X
} from "lucide-react"
import { Repository, Project } from "@/types/project"
import { ProjectService } from "@/services/projectService"

interface EditRepositoriesDialogProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (project: Project) => void
  onProjectUpdate?: (updatedProject: Project) => void
}

interface RepositoryFormData {
  name: string
  url: string
  description: string
  mainBranch: string
}

export function EditRepositoriesDialog({
  project,
  open,
  onOpenChange,
  onSave,
  onProjectUpdate
}: EditRepositoriesDialogProps) {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [editingRepo, setEditingRepo] = useState<string | null>(null)
  const [formData, setFormData] = useState<RepositoryFormData>({
    name: '',
    url: '',
    description: '',
    mainBranch: 'main'
  })
  const [loading, setLoading] = useState(false)

  // Inicializar repositorios cuando se abre el modal
  React.useEffect(() => {
    if (open && project) {
      setRepositories([...project.repositories])
    }
  }, [open, project])

  const handleAddRepository = () => {
    if (!formData.name || !formData.url) return

    const newRepo: Repository = {
      id: `temp-${Date.now()}`, // ID temporal para el frontend
      name: formData.name,
      url: formData.url,
      type: 'git', // Por defecto
      branch: formData.mainBranch,
      description: formData.description,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setRepositories([...repositories, newRepo])
    setFormData({
      name: '',
      url: '',
      description: '',
      mainBranch: 'main'
    })
  }

  const handleEditRepository = (repo: Repository) => {
    setEditingRepo(repo.id)
    setFormData({
      name: repo.name,
      url: repo.url,
      description: repo.description || '',
      mainBranch: repo.branch
    })
  }

  const handleUpdateRepository = () => {
    if (!editingRepo || !formData.name || !formData.url) return

    setRepositories(repos => 
      repos.map(repo => 
        repo.id === editingRepo 
          ? { 
              ...repo, 
              name: formData.name,
              url: formData.url,
              description: formData.description,
              branch: formData.mainBranch,
              updatedAt: new Date()
            }
          : repo
      )
    )

    setEditingRepo(null)
    setFormData({
      name: '',
      url: '',
      description: '',
      mainBranch: 'main'
    })
  }

  const handleDeleteRepository = (repoId: string) => {
    setRepositories(repos => repos.filter(repo => repo.id !== repoId))
  }

  const handleSave = async () => {
    if (!project) return

    setLoading(true)
    try {
      // Preparar datos para la actualización granular
      const updateData = {
        repositories: {
          add: repositories
            .filter(repo => repo.id.startsWith('temp-'))
            .map(repo => ({
              name: repo.name,
              url: repo.url,
              description: repo.description,
              mainBranch: repo.branch
            })), // Solo propiedades válidas para nuevos repositorios
          update: repositories
            .filter(repo => !repo.id.startsWith('temp-'))
            .map(repo => ({
              id: repo.id,
              name: repo.name,
              url: repo.url,
              description: repo.description,
              mainBranch: repo.branch
            })), // Solo propiedades válidas para repositorios existentes
          delete: project.repositories
            .filter(originalRepo => !repositories.find(repo => repo.id === originalRepo.id))
            .map(repo => repo.id) // IDs de repositorios eliminados
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
      console.error('Error al guardar repositorios:', error)
      alert('Error al guardar los repositorios. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditingRepo(null)
    setFormData({
      name: '',
      url: '',
      description: '',
      mainBranch: 'main'
    })
    if (project) {
      setRepositories([...project.repositories])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            Gestionar Repositorios
          </DialogTitle>
          <DialogDescription>
            Agrega, edita o elimina repositorios del proyecto {project?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulario para agregar/editar repositorio */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {editingRepo ? 'Editar Repositorio' : 'Agregar Nuevo Repositorio'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Repositorio *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="mi-proyecto-backend"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL del Repositorio *</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://github.com/empresa/mi-proyecto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mainBranch">Rama Principal</Label>
                <Input
                  id="mainBranch"
                  value={formData.mainBranch}
                  onChange={(e) => setFormData({ ...formData, mainBranch: e.target.value })}
                  placeholder="main"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Repositorio del backend en Node.js"
                />
              </div>
              <div className="flex gap-2">
                {editingRepo ? (
                  <>
                    <Button onClick={handleUpdateRepository} disabled={!formData.name || !formData.url}>
                      <Save className="mr-2 h-4 w-4" />
                      Actualizar
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleAddRepository} disabled={!formData.name || !formData.url}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Repositorio
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de repositorios */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Repositorios ({repositories.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {repositories.length > 0 ? (
                repositories.map((repo) => (
                  <div key={repo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Github className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="font-medium">{repo.name}</p>
                        <p className="text-sm text-gray-500">{repo.url}</p>
                        {repo.description && (
                          <p className="text-xs text-gray-400 mt-1">{repo.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        <GitBranch className="mr-1 h-3 w-3" />
                        {repo.branch}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRepository(repo)}
                        disabled={editingRepo === repo.id}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRepository(repo.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Github className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No hay repositorios configurados</p>
                  <p className="text-sm">Agrega tu primer repositorio usando el formulario de arriba</p>
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