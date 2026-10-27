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
import { Users, Plus, Loader2 } from "lucide-react"
import { ProjectTeamTable } from "@/components/project-team-table"
import { TEAM_ROLES } from "@/lib/team-roles"
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
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
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
              <div className="flex flex-wrap gap-2">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger aria-label="Miembro del workspace" className="min-w-0 flex-1 basis-full !h-14 sm:basis-0">
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
                  <SelectTrigger aria-label="Rol del nuevo participante" className="w-36 !h-14">
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
                  aria-label="Añadir participante al proyecto"
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

            <ProjectTeamTable key={`${project?.id}-${open}`} members={teamMembers}
              onRoleChange={handleRoleChange} onRemoveMember={handleRemove} disabled={saving} />
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
