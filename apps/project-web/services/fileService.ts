import { ProjectFile, FileType } from '@/types/project'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export class FileService {
  static async uploadFile(
    file: File, 
    projectId: string, 
    type: FileType, 
    description?: string
  ): Promise<ProjectFile> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', projectId)
    formData.append('type', type)
    if (description) {
      formData.append('description', description)
    }

    const response = await fetch(`${API_BASE_URL}/files`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Error al subir el archivo')
    }

    return await response.json()
  }

  static async uploadMultipleFiles(
    files: File[], 
    projectId: string, 
    type: FileType, 
    description?: string
  ): Promise<ProjectFile[]> {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    formData.append('projectId', projectId)
    formData.append('type', type)
    if (description) {
      formData.append('description', description)
    }

    const response = await fetch(`${API_BASE_URL}/files/multiple`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Error al subir los archivos')
    }

    return await response.json()
  }

  static async getFilesByProjectId(projectId: string): Promise<ProjectFile[]> {
    const response = await fetch(`${API_BASE_URL}/files/project/${projectId}`)

    if (!response.ok) {
      throw new Error('Error al obtener los archivos del proyecto')
    }

    return await response.json()
  }

  static async downloadFile(fileId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`)

    if (!response.ok) {
      throw new Error('Error al descargar el archivo')
    }

    return await response.blob()
  }

  static async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Error al eliminar el archivo')
    }
  }

  static async getFileInfo(fileId: string): Promise<ProjectFile> {
    const response = await fetch(`${API_BASE_URL}/files/info/${fileId}`)

    if (!response.ok) {
      throw new Error('Error al obtener información del archivo')
    }

    return await response.json()
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  static getFileIcon(mimetype: string): string {
    if (mimetype.startsWith('image/')) return '🖼️'
    if (mimetype.startsWith('video/')) return '🎥'
    if (mimetype.startsWith('audio/')) return '🎵'
    if (mimetype.includes('pdf')) return '📄'
    if (mimetype.includes('word') || mimetype.includes('document')) return '📝'
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return '📊'
    if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return '📈'
    if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('7z')) return '📦'
    if (mimetype.includes('text/')) return '📄'
    return '📎'
  }
} 