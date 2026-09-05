"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Plus, Trash2, Loader2, UserCheck } from "lucide-react"
import { TeamMember, Project } from "@/types/project"
import { ProjectService } from "@/services/projectService"
import { WorkspaceService, type WorkspaceMember } from "@/services/userService"
import { useWorkspace } from "@/contexts/workspace-context"

interface EditTeamMembersDialogProps {
  project: Project | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (project: Project) => void
  onProjectUpdate?: (updatedProject: Project) => void
  workspaceId?: string
  workspaceName?: string
}

const TEAM_ROLES = [
  { value: 'tech_lead', label: 'Tech Lead' },
  { value: 'developer', label: 'Developer' },
  { value: 'devops', label: 'DevOps' },
  { value: 'product_owner', label: 'Product Owner' },
  { value: 'scrum_master', label: 'Scrum Master' },
  { value: 'qa', label: 'QA' },
  { value: 'designer', label: 'Designer' },
  { value: 'architect', label: 'Architect' },
]

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function EditTeamMembersDialog({
  project,
  open,
  onOpenChange,
  onSave,
  onProjectUpdate,
  workspaceId,
  workspaceName,
}: EditTeamMembersDialogProps) {
  const { selectedWorkspace } = useWorkspace()
  const activeWorkspaceId = workspaceId ?? selectedWorkspace?.id
  const activeWorkspaceName = workspaceName ?? selectedWorkspace?.name

  const [teamMembers, setTeamMembers] = React.useState<TeamMember[]>([])
  const [wsMembers, setWsMembers] = React.useState<WorkspaceMember[]>([])
  const [wsLoading, setWsLoading] = React.useState(false)
  const [wsLoadError, setWsLoadError] = React.useState("")

  const [selectedUserId, setSelectedUserId] = React.useState("")
  const [selectedRole, setSelectedRole] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!open || !project) return
    setTeamMembers([...(project.teamMembers ?? [])])
    setSelectedUserId("")
    setSelectedRole("")
    setWsMembers([])
    setWsLoadError("")

    if (activeWorkspaceId) {
      setWsLoading(true)
      WorkspaceService.getMembers(activeWorkspaceId)
        .then(setWsMembers)
        .catch(() => setWsLoadError("No fue posible cargar los miembros del workspace."))
        .finally(() => setWsLoading(false))
    }
  }, [open, project, activeWorkspaceId])

  // Miembros del workspace que aún no están en el proyecto
  const availableWsMembers = wsMembers.filter(
    wm => !teamMembers.some(tm => tm.userId === wm.userId)
  )

  const handleAdd = () => {
    const wm = wsMembers.find(m => m.userId === selectedUserId)
    if (!wm || !wm.user || !selectedRole) return

    const newMember: TeamMember = {
      id: `temp-${Date.now()}`,
      userId: wm.userId,
      name: wm.user.name,
      email: wm.user.email,
      role: selectedRole,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setTeamMembers(prev => [...prev, newMember])
    setSelectedUserId("")
    setSelectedRole("")
  }

  const handleRemove = (memberId: string) => {
    setTeamMembers(prev => prev.filter(m => m.id !== memberId))
  }

  const handleRoleChange = (memberId: string, role: string) => {
    setTeamMembers(prev => prev.map(member =>
      member.id === memberId ? { ...member, role } : member
    ))
  }

  const handleSave = async () => {
    if (!project) return
    setSaving(true)
    try {
      const updateData = {
        teamMembers: {
          add: teamMembers
            .filter(m => m.id.startsWith('temp-'))
            .map(m => ({ userId: m.userId ?? undefined, name: m.name, email: m.email, role: m.role })),
          update: teamMembers
            .filter(m => !m.id.startsWith('temp-'))
            .map(m => ({ id: m.id, userId: m.userId ?? undefined, name: m.name, email: m.email, role: m.role })),
          delete: project.teamMembers
            .filter(orig => !teamMembers.find(m => m.id === orig.id))
            .map(m => m.id),
        },
      }

      const updatedProject = await ProjectService.granularUpdateProject(project.id, updateData)
      onProjectUpdate?.(updatedProject)
      onSave(updatedProject)
      onOpenChange(false)
    } catch (error) {
      console.error('Error al guardar miembros del equipo:', error)
      alert('Error al guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Miembros del equipo
          </DialogTitle>
          <DialogDescription>
            Asigna miembros del workspace{" "}
            <span className="font-medium">{activeWorkspaceName}</span> al proyecto{" "}
            <span className="font-medium">{project?.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Agregar miembro desde workspace */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Añadir desde el workspace</Label>

            {wsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando miembros...
              </div>
            ) : wsLoadError ? (
              <p className="text-sm text-destructive py-2">{wsLoadError}</p>
            ) : availableWsMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                {wsMembers.length === 0
                  ? "No hay miembros en el workspace."
                  : "Todos los miembros del workspace ya están en el proyecto."}
              </p>
            ) : (
              <div className="flex gap-2">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="flex-1 !h-14">
                    <SelectValue placeholder="Selecciona un miembro..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWsMembers.map(wm => (
                      <SelectItem key={wm.userId} value={wm.userId} textValue={wm.user?.name ?? wm.userId}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{wm.user?.name}</span>
                          {wm.user?.email && (
                            <span className="text-sm text-muted-foreground">{wm.user.email}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-36 !h-14">
                    <SelectValue placeholder="Rol..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAM_ROLES.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  size="icon"
                  className="h-14 w-14 shrink-0"
                  onClick={handleAdd}
                  disabled={!selectedUserId || !selectedRole}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Lista de miembros en el proyecto */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              En el proyecto ({teamMembers.length})
            </Label>

            {teamMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Sin miembros asignados</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {teamMembers.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg border bg-card"
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                    <Select
                      value={member.role}
                      onValueChange={(role) => handleRoleChange(member.id, role)}
                    >
                      <SelectTrigger className="h-8 w-36 text-xs shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEAM_ROLES.map(role => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleRemove(member.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
