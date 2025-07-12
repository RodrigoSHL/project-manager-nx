"use client"

import * as React from "react"
import { useState, useRef } from "react"
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
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Edit3,
  Save,
  X,
  Plus,
  File,
  BookOpen,
  Image,
  Code,
  Database,
  GitBranch,
  Settings,
  TestTube,
  Rocket,
  Palette,
  FileCode,
  Users,
  Globe,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"
import { ProjectFile, FileType, Project } from "@/types/project"
import { FileService } from "@/services/fileService"

interface EditDocumentsDialogProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (project: Project) => void
  onProjectUpdate?: (updatedProject: Project) => void
}

interface FileFormData {
  type: FileType
  description: string
}

const FILE_TYPES = [
  { value: FileType.MANUAL, label: 'Manual', icon: BookOpen, color: 'bg-blue-100 text-blue-800' },
  { value: FileType.DIAGRAM, label: 'Diagrama', icon: Image, color: 'bg-purple-100 text-purple-800' },
  { value: FileType.FLOW, label: 'Flujo', icon: GitBranch, color: 'bg-green-100 text-green-800' },
  { value: FileType.DOCUMENTATION, label: 'Documentación', icon: FileText, color: 'bg-gray-100 text-gray-800' },
  { value: FileType.ARCHITECTURE, label: 'Arquitectura', icon: Database, color: 'bg-orange-100 text-orange-800' },
  { value: FileType.API_DOCS, label: 'API Docs', icon: Code, color: 'bg-indigo-100 text-indigo-800' },
  { value: FileType.USER_GUIDE, label: 'Guía de Usuario', icon: Users, color: 'bg-pink-100 text-pink-800' },
  { value: FileType.TECHNICAL_SPEC, label: 'Especificación Técnica', icon: FileCode, color: 'bg-teal-100 text-teal-800' },
  { value: FileType.REQUIREMENTS, label: 'Requerimientos', icon: AlertCircle, color: 'bg-red-100 text-red-800' },
  { value: FileType.DESIGN, label: 'Diseño', icon: Palette, color: 'bg-yellow-100 text-yellow-800' },
  { value: FileType.TEST_PLAN, label: 'Plan de Pruebas', icon: TestTube, color: 'bg-cyan-100 text-cyan-800' },
  { value: FileType.DEPLOYMENT_GUIDE, label: 'Guía de Despliegue', icon: Rocket, color: 'bg-emerald-100 text-emerald-800' },
  { value: FileType.OTHER, label: 'Otro', icon: File, color: 'bg-gray-100 text-gray-800' }
]

export function EditDocumentsDialog({
  project,
  open,
  onOpenChange,
  onSave,
  onProjectUpdate
}: EditDocumentsDialogProps) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [formData, setFormData] = useState<FileFormData>({
    type: FileType.OTHER,
    description: ''
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar archivos cuando se abre el modal
  React.useEffect(() => {
    if (open && project) {
      loadProjectFiles()
    }
  }, [open, project])

  const loadProjectFiles = async () => {
    if (!project) return
    
    try {
      const projectFiles = await FileService.getFilesByProjectId(project.id)
      setFiles(projectFiles)
    } catch (error) {
      console.error('Error al cargar archivos:', error)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    setSelectedFiles(selectedFiles)
  }

  const handleUploadFiles = async () => {
    if (!project || selectedFiles.length === 0) return

    setUploading(true)
    try {
      const uploadedFiles = await FileService.uploadMultipleFiles(
        selectedFiles,
        project.id,
        formData.type,
        formData.description
      )

      // Actualizar la lista de archivos
      setFiles(prev => [...prev, ...uploadedFiles])
      
      // Limpiar el formulario
      setSelectedFiles([])
      setFormData({
        type: FileType.OTHER,
        description: ''
      })
      
      // Limpiar el input de archivos
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Actualizar el proyecto en el estado local
      if (onProjectUpdate) {
        const updatedProject = {
          ...project,
          files: [...project.files, ...uploadedFiles]
        }
        onProjectUpdate(updatedProject)
      }
    } catch (error) {
      console.error('Error al subir archivos:', error)
      alert('Error al subir los archivos. Por favor, intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadFile = async (file: ProjectFile) => {
    try {
      const blob = await FileService.downloadFile(file.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error al descargar archivo:', error)
      alert('Error al descargar el archivo. Por favor, intenta de nuevo.')
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este archivo?')) return

    setDeleting(fileId)
    try {
      await FileService.deleteFile(fileId)
      
      // Actualizar la lista de archivos
      setFiles(prev => prev.filter(f => f.id !== fileId))
      
      // Actualizar el proyecto en el estado local
      if (onProjectUpdate && project) {
        const updatedProject = {
          ...project,
          files: project.files.filter(f => f.id !== fileId)
        }
        onProjectUpdate(updatedProject)
      }
    } catch (error) {
      console.error('Error al eliminar archivo:', error)
      alert('Error al eliminar el archivo. Por favor, intenta de nuevo.')
    } finally {
      setDeleting(null)
    }
  }

  const getTypeBadge = (type: FileType) => {
    const typeInfo = FILE_TYPES.find(t => t.value === type)
    return typeInfo ? (
      <Badge className={typeInfo.color}>
        {typeInfo.label}
      </Badge>
    ) : (
      <Badge variant="secondary">{type}</Badge>
    )
  }

  const getTypeIcon = (type: FileType) => {
    const typeInfo = FILE_TYPES.find(t => t.value === type)
    const IconComponent = typeInfo ? typeInfo.icon : File
    return <IconComponent className="h-4 w-4" />
  }

  const getFileIcon = (mimetype: string) => {
    return FileService.getFileIcon(mimetype)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gestionar Documentos
          </DialogTitle>
          <DialogDescription>
            Sube, descarga o elimina documentos del proyecto {project?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          {/* Formulario para subir archivos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Subir Nuevos Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="files">Seleccionar Archivos *</Label>
                <Input
                  id="files"
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="*/*"
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">Archivos seleccionados:</p>
                    <div className="space-y-1">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <span>{getFileIcon(file.type)}</span>
                          <span className="font-medium">{file.name}</span>
                          <span className="text-gray-500">({FileService.formatFileSize(file.size)})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Documento *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as FileType })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_TYPES.map((type) => (
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
                  placeholder="Descripción de los documentos..."
                  rows={3}
                />
              </div>
              <Button 
                onClick={handleUploadFiles} 
                disabled={selectedFiles.length === 0 || uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Subir Documentos ({selectedFiles.length})
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Lista de documentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Documentos del Proyecto ({files.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {files.length > 0 ? (
                files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg">
                        {getFileIcon(file.mimetype)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-base">{file.filename}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500">{FileService.formatFileSize(file.size)}</span>
                          <span className="text-sm text-gray-400">•</span>
                          <span className="text-sm text-gray-500">
                            {new Date(file.uploadedAt).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        {file.description && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{file.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {getTypeBadge(file.type)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadFile(file)}
                        className="hover:bg-blue-50"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFile(file.id)}
                        disabled={deleting === file.id}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        {deleting === file.id ? (
                          <Clock className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No hay documentos en el proyecto</p>
                  <p className="text-sm">Sube tu primer documento usando el formulario de arriba</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 