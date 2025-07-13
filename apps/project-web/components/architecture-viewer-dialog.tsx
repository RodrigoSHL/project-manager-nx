"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  Download, 
  X, 
  Image,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from "lucide-react"
import { Project, ProjectFile, FileType } from "@/types/project"

interface ArchitectureViewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project
}

export function ArchitectureViewerDialog({ 
  open, 
  onOpenChange, 
  project 
}: ArchitectureViewerDialogProps) {
  const [architectureFiles, setArchitectureFiles] = useState<ProjectFile[]>([])
  const [currentFileIndex, setCurrentFileIndex] = useState(0)

  useEffect(() => {
    if (open && project?.files) {
      const archFiles = project.files
        .filter(file => file.type === 'architecture')
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      
      setArchitectureFiles(archFiles)
      setCurrentFileIndex(0)
    }
  }, [open, project])

  const currentFile = architectureFiles[currentFileIndex]

  const handlePrevious = () => {
    setCurrentFileIndex(prev => prev > 0 ? prev - 1 : architectureFiles.length - 1)
  }

  const handleNext = () => {
    setCurrentFileIndex(prev => prev < architectureFiles.length - 1 ? prev + 1 : 0)
  }

  const handleDownload = () => {
    if (currentFile) {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/files/${currentFile.id}`
      window.open(url, '_blank')
    }
  }

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return '🖼️'
    if (mimetype.includes('pdf')) return '📄'
    if (mimetype.includes('svg')) return '🎨'
    return '📎'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!currentFile) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[90vw] !w-[90vw] !max-h-[90vh] !h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Diagrama de Arquitectura
            {architectureFiles.length > 1 && (
              <span className="ml-2 text-sm text-gray-500 font-medium">
                {currentFileIndex + 1} / {architectureFiles.length}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-4 min-h-0 flex-1">
          {/* Panel principal con la imagen */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Controles de navegación */}
            {architectureFiles.length > 1 && (
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={architectureFiles.length <= 1}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={architectureFiles.length <= 1}
                >
                  Siguiente
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Imagen principal */}
            <div className="flex-1 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center min-h-0">
              {currentFile.mimetype.startsWith('image/') ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/files/${currentFile.id}`}
                  alt={currentFile.filename}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">{getFileIcon(currentFile.mimetype)}</div>
                  <p className="text-lg font-medium">{currentFile.filename}</p>
                  <p className="text-sm">Este archivo no se puede previsualizar</p>
                </div>
              )}
            </div>

            {/* Información del archivo */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{currentFile.filename}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{currentFile.type}</Badge>
                    <span className="text-sm text-gray-500">
                      {formatFileSize(currentFile.size)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(currentFile.uploadedAt).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  {currentFile.description && (
                    <p className="text-sm text-gray-600 mt-2">{currentFile.description}</p>
                  )}
                </div>
                <Button onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Descargar
                </Button>
              </div>
            </div>
          </div>

          {/* Panel lateral con lista de archivos */}
          {architectureFiles.length > 1 && (
            <div className="w-full lg:w-80 lg:border-l lg:border-gray-200 lg:pl-4 flex-shrink-0 border-t border-gray-200 pt-4 lg:pt-0">
              <h3 className="font-medium mb-3">Todos los diagramas</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {architectureFiles.map((file, index) => (
                  <Card
                    key={file.id}
                    className={`cursor-pointer transition-colors ${
                      index === currentFileIndex 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setCurrentFileIndex(index)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">
                          {getFileIcon(file.mimetype)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{file.filename}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(file.uploadedAt).toLocaleDateString('es-ES')}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Más reciente
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 