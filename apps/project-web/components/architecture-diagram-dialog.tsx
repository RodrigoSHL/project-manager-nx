"use client"

import * as React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  Download, 
  Trash2, 
  Save, 
  X, 
  Image,
  FileText,
  Eye,
  Edit3,
  Cloud,
  Server,
  Database,
  Globe,
  Zap,
  Shield,
  Activity
} from "lucide-react"
import { Project } from "@/types/project"
import { ProjectService } from "@/services/projectService"
import { FileService } from "@/services/fileService"

interface ArchitectureDiagramDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project
  onProjectUpdate: (project: Project) => void
}

export function ArchitectureDiagramDialog({ 
  open, 
  onOpenChange, 
  project, 
  onProjectUpdate 
}: ArchitectureDiagramDialogProps) {
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [description, setDescription] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/svg+xml', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        alert('Por favor selecciona un archivo de imagen (PNG, JPEG, GIF, SVG) o PDF')
        return
      }
      
      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo es demasiado grande. El tamaño máximo es 10MB')
        return
      }
      
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Por favor selecciona un archivo')
      return
    }

    setUploading(true)
    try {
      const uploadedFile = await FileService.uploadFile(selectedFile, project.id, 'architecture' as any, description || 'Diagrama de arquitectura del proyecto')
      
      // Actualizar el proyecto con la referencia al diagrama
      const updatedProject = await ProjectService.updateProject(project.id, {
        ...project,
        architectureDiagram: uploadedFile.id
      })
      
      onProjectUpdate(updatedProject)
      onOpenChange(false)
      
      // Limpiar el formulario
      setSelectedFile(null)
      setDescription("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error('Error al subir el diagrama:', error)
      alert('Error al subir el archivo. Por favor intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async () => {
    if (!project.architectureDiagram) return
    
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/files/${project.architectureDiagram}`
      window.open(url, '_blank')
    } catch (error) {
      console.error('Error al descargar el diagrama:', error)
      alert('Error al descargar el archivo.')
    }
  }

  const handleDelete = async () => {
    if (!project.architectureDiagram) return
    
    if (!confirm('¿Estás seguro de que quieres eliminar el diagrama de arquitectura?')) {
      return
    }

    try {
      // Eliminar el archivo
      await FileService.deleteFile(project.architectureDiagram)
      
      // Actualizar el proyecto
      const updatedProject = await ProjectService.updateProject(project.id, {
        ...project,
        architectureDiagram: undefined
      })
      
      onProjectUpdate(updatedProject)
    } catch (error) {
      console.error('Error al eliminar el diagrama:', error)
      alert('Error al eliminar el archivo.')
    }
  }

  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
        return <Image className="h-8 w-8 text-blue-600" />
      case 'svg':
        return <Image className="h-8 w-8 text-green-600" />
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-600" />
      default:
        return <FileText className="h-8 w-8 text-gray-600" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Diagrama de Arquitectura
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Diagrama actual */}
          {project.architectureDiagram ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Diagrama Actual</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDelete}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  {getFileIcon('diagram.png')}
                  <div>
                    <p className="font-medium">Diagrama de Arquitectura</p>
                                         <p className="text-sm text-gray-500">Haz clic en &quot;Descargar&quot; para ver el archivo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Subir Nuevo Diagrama</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="diagram-file">Seleccionar Archivo</Label>
                  <Input
                    id="diagram-file"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,.pdf"
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-gray-500">
                    Formatos soportados: PNG, JPEG, GIF, SVG, PDF. Tamaño máximo: 10MB
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción (opcional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción del diagrama de arquitectura"
                    rows={3}
                  />
                </div>

                {selectedFile && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Archivo seleccionado:</span>
                    </div>
                    <p className="text-sm text-blue-800 mt-1">{selectedFile.name}</p>
                    <p className="text-xs text-blue-600">
                      Tamaño: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleUpload} 
                    disabled={!selectedFile || uploading}
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Subir Diagrama
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Información sobre diagramas de arquitectura */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Información
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Server className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Infraestructura</p>
                    <p className="text-xs text-gray-600">
                      Muestra la estructura de servidores, contenedores y servicios cloud
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Database className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Base de Datos</p>
                    <p className="text-xs text-gray-600">
                      Representa las bases de datos y sus relaciones
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="h-4 w-4 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Redes</p>
                    <p className="text-xs text-gray-600">
                      Incluye load balancers, CDNs y configuraciones de red
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Seguridad</p>
                    <p className="text-xs text-gray-600">
                      Muestra firewalls, WAFs y configuraciones de seguridad
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
} 