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
  Users, 
  Mail, 
  Phone, 
  Plus, 
  Trash2, 
  Edit3,
  Save,
  X
} from "lucide-react"
import { TeamMember, Project } from "@/types/project"
import { ProjectService } from "@/services/projectService"

interface EditTeamMembersDialogProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (project: Project) => void
  onProjectUpdate?: (updatedProject: Project) => void
}

interface TeamMemberFormData {
  name: string
  email: string
  role: string
  phone: string
}

const TEAM_ROLES = [
  { value: 'tech_lead', label: 'Tech Lead' },
  { value: 'developer', label: 'Developer' },
  { value: 'devops', label: 'DevOps' },
  { value: 'product_owner', label: 'Product Owner' },
  { value: 'scrum_master', label: 'Scrum Master' },
  { value: 'qa', label: 'QA' },
  { value: 'designer', label: 'Designer' },
  { value: 'architect', label: 'Architect' }
]

export function EditTeamMembersDialog({
  project,
  open,
  onOpenChange,
  onSave,
  onProjectUpdate
}: EditTeamMembersDialogProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [formData, setFormData] = useState<TeamMemberFormData>({
    name: '',
    email: '',
    role: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)

  // Inicializar miembros del equipo cuando se abre el modal
  React.useEffect(() => {
    if (open && project) {
      setTeamMembers([...project.teamMembers])
    }
  }, [open, project])

  const handleAddTeamMember = () => {
    if (!formData.name || !formData.email || !formData.role) return

    const newMember: TeamMember = {
      id: `temp-${Date.now()}`, // ID temporal para el frontend
      name: formData.name,
      email: formData.email,
      role: formData.role,
      phone: formData.phone || undefined,
      avatar: undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setTeamMembers([...teamMembers, newMember])
    setFormData({
      name: '',
      email: '',
      role: '',
      phone: ''
    })
  }

  const handleEditTeamMember = (member: TeamMember) => {
    setEditingMember(member.id)
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      phone: member.phone || ''
    })
  }

  const handleUpdateTeamMember = () => {
    if (!editingMember || !formData.name || !formData.email || !formData.role) return

    setTeamMembers(members => 
      members.map(member => 
        member.id === editingMember 
          ? { 
              ...member, 
              name: formData.name,
              email: formData.email,
              role: formData.role,
              phone: formData.phone || undefined,
              updatedAt: new Date()
            }
          : member
      )
    )

    setEditingMember(null)
    setFormData({
      name: '',
      email: '',
      role: '',
      phone: ''
    })
  }

  const handleDeleteTeamMember = (memberId: string) => {
    setTeamMembers(members => members.filter(member => member.id !== memberId))
  }

  const handleSave = async () => {
    if (!project) return

    setLoading(true)
    try {
      // Preparar datos para la actualización granular
      const updateData = {
        teamMembers: {
          add: teamMembers
            .filter(member => member.id.startsWith('temp-'))
            .map(member => ({
              name: member.name,
              email: member.email,
              role: member.role,
              phone: member.phone
            })), // Solo propiedades válidas para nuevos miembros
          update: teamMembers
            .filter(member => !member.id.startsWith('temp-'))
            .map(member => ({
              id: member.id,
              name: member.name,
              email: member.email,
              role: member.role,
              phone: member.phone
            })), // Solo propiedades válidas para miembros existentes
          delete: project.teamMembers
            .filter(originalMember => !teamMembers.find(member => member.id === originalMember.id))
            .map(member => member.id) // IDs de miembros eliminados
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
      console.error('Error al guardar miembros del equipo:', error)
      alert('Error al guardar los miembros del equipo. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditingMember(null)
    setFormData({
      name: '',
      email: '',
      role: '',
      phone: ''
    })
    if (project) {
      setTeamMembers([...project.teamMembers])
    }
  }

  const getRoleBadge = (role: string) => {
    const roleInfo = TEAM_ROLES.find(r => r.value === role)
    return roleInfo ? roleInfo.label : role
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestionar Miembros del Equipo
          </DialogTitle>
          <DialogDescription>
            Agrega, edita o elimina miembros del equipo del proyecto {project?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          {/* Formulario para agregar/editar miembro */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {editingMember ? 'Editar Miembro del Equipo' : 'Agregar Nuevo Miembro'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Juan Pérez"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="juan.perez@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol en el Proyecto *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+34 600 123 456"
                />
              </div>
              <div className="flex gap-2">
                {editingMember ? (
                  <>
                    <Button onClick={handleUpdateTeamMember} disabled={!formData.name || !formData.email || !formData.role}>
                      <Save className="mr-2 h-4 w-4" />
                      Actualizar
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleAddTeamMember} disabled={!formData.name || !formData.email || !formData.role}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Miembro
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de miembros del equipo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Miembros del Equipo ({teamMembers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamMembers.length > 0 ? (
                teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-base">{member.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="h-3 w-3 text-gray-500" />
                          <p className="text-sm text-gray-500 truncate">{member.email}</p>
                        </div>
                        {member.phone && (
                          <div className="flex items-center gap-2 mt-1">
                            <Phone className="h-3 w-3 text-gray-500" />
                            <p className="text-xs text-gray-400">{member.phone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {getRoleBadge(member.role)}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTeamMember(member)}
                        disabled={editingMember === member.id}
                        className="hover:bg-blue-50"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTeamMember(member.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No hay miembros del equipo configurados</p>
                  <p className="text-sm">Agrega tu primer miembro usando el formulario de arriba</p>
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