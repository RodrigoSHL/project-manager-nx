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
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Trash2, 
  Edit3,
  Save,
  X,
  CalendarDays
} from "lucide-react"
import { Task, Project } from "@/types/project"
import { ProjectService } from "@/services/projectService"

interface EditTasksDialogProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (project: Project) => void
  onProjectUpdate?: (updatedProject: Project) => void
}

interface TaskFormData {
  title: string
  description: string
  priority: string
  dueDate: string
}

const TASK_PRIORITIES = [
  { value: 'low', label: 'Baja', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Media', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: 'critical', label: 'Crítica', color: 'bg-red-100 text-red-800' }
]

export function EditTasksDialog({
  project,
  open,
  onOpenChange,
  onSave,
  onProjectUpdate
}: EditTasksDialogProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: ''
  })
  const [loading, setLoading] = useState(false)

  // Inicializar tareas cuando se abre el modal
  React.useEffect(() => {
    if (open && project) {
      setTasks([...project.tasks])
    }
  }, [open, project])

  const handleAddTask = () => {
    if (!formData.title) return

    const newTask: Task = {
      id: `temp-${Date.now()}`, // ID temporal para el frontend
      title: formData.title,
      description: formData.description,
      status: 'todo',
      priority: formData.priority,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setTasks([...tasks, newTask])
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: ''
    })
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task.id)
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
    })
  }

  const handleUpdateTask = () => {
    if (!editingTask || !formData.title) return

    setTasks(tasks => 
      tasks.map(task => 
        task.id === editingTask 
          ? { 
              ...task, 
              title: formData.title,
              description: formData.description,
              priority: formData.priority,
              dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
              updatedAt: new Date()
            }
          : task
      )
    )

    setEditingTask(null)
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: ''
    })
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks => tasks.filter(task => task.id !== taskId))
  }

  const handleSave = async () => {
    if (!project) return

    setLoading(true)
    try {
      // Preparar datos para la actualización granular
      const updateData = {
        tasks: {
          add: tasks
            .filter(task => task.id.startsWith('temp-'))
            .map(task => ({
              title: task.title,
              description: task.description,
              priority: task.priority,
              dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : undefined
            })), // Solo propiedades válidas para nuevas tareas
          update: tasks
            .filter(task => !task.id.startsWith('temp-'))
            .map(task => ({
              id: task.id,
              title: task.title,
              description: task.description,
              priority: task.priority,
              dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : undefined
            })), // Solo propiedades válidas para tareas existentes
          delete: project.tasks
            .filter(originalTask => !tasks.find(task => task.id === originalTask.id))
            .map(task => task.id) // IDs de tareas eliminadas
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
      console.error('Error al guardar tareas:', error)
      alert('Error al guardar las tareas. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditingTask(null)
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: ''
    })
    if (project) {
      setTasks([...project.tasks])
    }
  }

  const getPriorityBadge = (priority: string) => {
    const priorityInfo = TASK_PRIORITIES.find(p => p.value === priority)
    return priorityInfo ? (
      <Badge className={priorityInfo.color}>
        {priorityInfo.label}
      </Badge>
    ) : (
      <Badge variant="secondary">{priority}</Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      'todo': { label: 'Pendiente', color: 'bg-gray-100 text-gray-800' },
      'in_progress': { label: 'En Progreso', color: 'bg-blue-100 text-blue-800' },
      'review': { label: 'En Revisión', color: 'bg-yellow-100 text-yellow-800' },
      'done': { label: 'Completada', color: 'bg-green-100 text-green-800' },
      'cancelled': { label: 'Cancelada', color: 'bg-red-100 text-red-800' }
    }
    
    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    )
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Sin fecha'
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gestionar Tareas del Proyecto
          </DialogTitle>
          <DialogDescription>
            Agrega, edita o elimina tareas del proyecto {project?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          {/* Formulario para agregar/editar tarea */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {editingTask ? 'Editar Tarea' : 'Agregar Nueva Tarea'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Título de la Tarea *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Implementar autenticación 2FA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción detallada de la tarea..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_PRIORITIES.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {editingTask ? (
                  <>
                    <Button onClick={handleUpdateTask} disabled={!formData.title}>
                      <Save className="mr-2 h-4 w-4" />
                      Actualizar
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleAddTask} disabled={!formData.title}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Tarea
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de tareas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Tareas del Proyecto ({tasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-base">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusBadge(task.status)}
                          {getPriorityBadge(task.priority)}
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <CalendarDays className="h-3 w-3" />
                              {formatDate(task.dueDate)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTask(task)}
                        disabled={editingTask === task.id}
                        className="hover:bg-blue-50"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No hay tareas configuradas</p>
                  <p className="text-sm">Agrega tu primera tarea usando el formulario de arriba</p>
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