"use client"

import * as React from "react"
import { useState, useRef, useCallback } from "react"
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
  Clock,
  FileImage,
  FileArchive,
  FileVideo,
  FileAudio
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

interface FileToUpload {
  file: File
  id: string
  name: string
  type: FileType
  description: string
  preview?: string
}

const FILE_TYPES = [
  { value: FileType.MANUAL, label: 'Manual', icon: BookOpen, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: FileType.DIAGRAM, label: 'Diagrama', icon: Image, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: FileType.FLOW, label: 'Flujo', icon: GitBranch, color: 'bg-green-50 text-green-700 border-green-200' },
  { value: FileType.DOCUMENTATION, label: 'Documentación', icon: FileText, color: 'bg-gray-50 text-gray-700 border-gray-200' },
  { value: FileType.ARCHITECTURE, label: 'Arquitectura', icon: Database, color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: FileType.API_DOCS, label: 'API Docs', icon: Code, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: FileType.USER_GUIDE, label: 'Guía de Usuario', icon: Users, color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { value: FileType.TECHNICAL_SPEC, label: 'Especificación Técnica', icon: FileCode, color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { value: FileType.REQUIREMENTS, label: 'Requerimientos', icon: AlertCircle, color: 'bg-red-50 text-red-700 border-red-200' },
  { value: FileType.DESIGN, label: 'Diseño', icon: Palette, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: FileType.TEST_PLAN, label: 'Plan de Pruebas', icon: TestTube, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { value: FileType.DEPLOYMENT_GUIDE, label: 'Guía de Despliegue', icon: Rocket, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: FileType.OTHER, label: 'Otro', icon: File, color: 'bg-gray-50 text-gray-700 border-gray-200' }
]

export function EditDocumentsDialog({
  project,
  open,
  onOpenChange,
  onSave,
  onProjectUpdate
}: EditDocumentsDialogProps) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [filesToUpload, setFilesToUpload] = useState<FileToUpload[]>([])
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
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

  const generateFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      } else {
        resolve(undefined)
      }
    })
  }

  const handleFilesAdded = async (fileList: FileList) => {
    const newFiles: FileToUpload[] = []
    
    for (const file of Array.from(fileList)) {
      const preview = await generateFilePreview(file)
      newFiles.push({
        file,
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: FileType.OTHER,
        description: '',
        preview
      })
    }
    
    setFilesToUpload(prev => [...prev, ...newFiles])
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (selectedFiles) {
      handleFilesAdded(selectedFiles)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFilesAdded(droppedFiles)
    }
  }, [])

  const updateFileToUpload = (id: string, updates: Partial<FileToUpload>) => {
    setFilesToUpload(prev => 
      prev.map(file => 
        file.id === id ? { ...file, ...updates } : file
      )
    )
  }

  const removeFileToUpload = (id: string) => {
    setFilesToUpload(prev => prev.filter(file => file.id !== id))
  }

  const handleUploadFiles = async () => {
    if (!project || filesToUpload.length === 0) return

    // Verificar que todos los archivos tengan tipo asignado
    const hasAllTypes = filesToUpload.every(file => file.type !== FileType.OTHER)
    if (!hasAllTypes) {
      alert('Por favor, asigna un tipo a todos los archivos antes de subir.')
      return
    }

    setUploading(true)
    try {
      const filesWithData = filesToUpload.map(fileToUpload => ({
        file: fileToUpload.file,
        type: fileToUpload.type,
        description: fileToUpload.description
      }))

      const uploadedFiles = await FileService.uploadMultipleFilesWithIndividualTypes(
        filesWithData,
        project.id
      )

      // Actualizar la lista de archivos
      setFiles(prev => [...prev, ...uploadedFiles])
      
      // Limpiar archivos a subir
      setFilesToUpload([])
      
      // Limpiar el input de archivos
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Actualizar el proyecto en el estado local
      if (onProjectUpdate) {
        const updatedProject = {
          ...project,
          files: [...(project.files || []), ...uploadedFiles]
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
          files: (project.files || []).filter(f => f.id !== fileId)
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
      <Badge className={`${typeInfo.color} border`}>
        {typeInfo.label}
      </Badge>
    ) : (
      <Badge variant="secondary">{type}</Badge>
    )
  }

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return <FileImage className="h-4 w-4" />
    if (mimetype.includes('pdf')) return <FileText className="h-4 w-4" />
    if (mimetype.includes('zip') || mimetype.includes('rar')) return <FileArchive className="h-4 w-4" />
    if (mimetype.startsWith('video/')) return <FileVideo className="h-4 w-4" />
    if (mimetype.startsWith('audio/')) return <FileAudio className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const canUpload = filesToUpload.length > 0 && filesToUpload.every(file => file.type !== FileType.OTHER)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[90vw] !w-[90vw] !max-h-[90vh] !h-[90vh] overflow-y-auto">
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
          {/* Zona de drag and drop */}
          <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
            <CardContent className="p-8">
              <div
                className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
                  isDragOver 
                    ? 'border-indigo-400 bg-indigo-50 scale-[1.02]' 
                    : 'border-gray-300 hover:border-gray-400'
                } p-12 text-center`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  accept="*/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Seleccionar archivos para subir"
                />
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Arrastra archivos aquí o haz clic para seleccionar
                    </h3>
                    <p className="text-sm text-gray-500">
                      Soporta múltiples archivos. Máximo 10MB por archivo.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Archivos a subir */}
          {filesToUpload.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Archivos a subir ({filesToUpload.length})</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilesToUpload([])}
                    aria-label="Limpiar todos los archivos"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpiar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {filesToUpload.map((fileToUpload) => (
                  <Card key={fileToUpload.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Miniatura */}
                        <div className="flex-shrink-0">
                          {fileToUpload.preview ? (
                            <img
                              src={fileToUpload.preview}
                              alt={fileToUpload.name}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                              {getFileIcon(fileToUpload.file.type)}
                            </div>
                          )}
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor={`name-${fileToUpload.id}`}>Nombre del archivo</Label>
                            <Input
                              id={`name-${fileToUpload.id}`}
                              value={fileToUpload.name}
                              onChange={(e) => updateFileToUpload(fileToUpload.id, { name: e.target.value })}
                              className="text-sm"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor={`type-${fileToUpload.id}`}>Tipo de documento *</Label>
                              <Select
                                value={fileToUpload.type}
                                onValueChange={(value) => updateFileToUpload(fileToUpload.id, { type: value as FileType })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un tipo" />
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
                              <Label htmlFor={`description-${fileToUpload.id}`}>Descripción</Label>
                              <Textarea
                                id={`description-${fileToUpload.id}`}
                                value={fileToUpload.description}
                                onChange={(e) => updateFileToUpload(fileToUpload.id, { description: e.target.value })}
                                placeholder="Descripción opcional..."
                                rows={2}
                                className="text-sm"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{FileService.formatFileSize(fileToUpload.file.size)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFileToUpload(fileToUpload.id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              aria-label="Eliminar archivo"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button 
                  onClick={handleUploadFiles} 
                  disabled={!canUpload || uploading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  size="lg"
                >
                  {uploading ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Subiendo archivos...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Subir archivos ({filesToUpload.length})
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Lista de documentos existentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Documentos del Proyecto ({files.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {files.length > 0 ? (
                files.map((file) => (
                  <div 
                    key={file.id} 
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    {/* Miniatura */}
                    <div className="flex-shrink-0">
                      {file.mimetype.startsWith('image/') ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/files/${file.id}`}
                          alt={file.filename}
                          className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getFileIcon(file.mimetype)}
                        </div>
                      )}
                    </div>

                    {/* Información del archivo */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.filename}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-500">{FileService.formatFileSize(file.size)}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {new Date(file.uploadedAt).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                      {file.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{file.description}</p>
                      )}
                    </div>

                    {/* Tipo y acciones */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getTypeBadge(file.type)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadFile(file)}
                        className="hover:bg-blue-50"
                        aria-label="Descargar archivo"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFile(file.id)}
                        disabled={deleting === file.id}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        aria-label="Eliminar archivo"
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
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No hay documentos en el proyecto</p>
                  <p className="text-sm">Sube tu primer documento usando la zona de arriba</p>
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