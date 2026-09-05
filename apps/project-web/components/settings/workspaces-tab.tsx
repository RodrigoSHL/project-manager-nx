"use client"

import * as React from "react"
import { Plus, Building2, Users, Trash2, ChevronRight, Copy, Check, Loader2, UserPlus, Crown, Shield, Eye, User as UserIcon, FolderOpen, Link2, Unlink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { WorkspaceService, UserService, type Workspace, type WorkspaceMember, type User } from "@/services/userService"
import { ProjectService } from "@/services/projectService"
import { type Project } from "@/types/project"
import { EditTeamMembersDialog } from "@/components/edit-team-members-dialog"

const roleConfig = {
  owner:  { label: "Owner",  icon: Crown,  color: "text-amber-600 bg-amber-50 border-amber-200" },
  admin:  { label: "Admin",  icon: Shield, color: "text-blue-600 bg-blue-50 border-blue-200" },
  member: { label: "Member", icon: UserIcon, color: "text-green-600 bg-green-50 border-green-200" },
  viewer: { label: "Viewer", icon: Eye,    color: "text-gray-600 bg-gray-50 border-gray-200" },
}

function RoleBadge({ role }: { role: string }) {
  const cfg = roleConfig[role as keyof typeof roleConfig] ?? roleConfig.member
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
      <cfg.icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

export function WorkspacesTab() {
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([])
  const [selectedWs, setSelectedWs] = React.useState<Workspace | null>(null)
  const [members, setMembers] = React.useState<WorkspaceMember[]>([])
  const [allUsers, setAllUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [membersLoading, setMembersLoading] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  // Dialogs
  const [createOpen, setCreateOpen] = React.useState(false)
  const [addMemberOpen, setAddMemberOpen] = React.useState(false)

  // Form create workspace
  const [wsName, setWsName] = React.useState("")
  const [wsSlug, setWsSlug] = React.useState("")
  const [wsDesc, setWsDesc] = React.useState("")
  const [creating, setCreating] = React.useState(false)
  const [createError, setCreateError] = React.useState("")

  // Form add member
  const [selectedUserId, setSelectedUserId] = React.useState("")
  const [selectedRole, setSelectedRole] = React.useState<string>("member")
  const [addingMember, setAddingMember] = React.useState(false)
  const [addMemberError, setAddMemberError] = React.useState("")

  // Projects in workspace
  const [wsProjects, setWsProjects] = React.useState<Project[]>([])
  const [wsProjectsLoading, setWsProjectsLoading] = React.useState(false)
  const [allProjects, setAllProjects] = React.useState<Project[]>([])
  const [linkProjectOpen, setLinkProjectOpen] = React.useState(false)
  const [linkProjectId, setLinkProjectId] = React.useState("")
  const [linkingProject, setLinkingProject] = React.useState(false)
  const [teamProject, setTeamProject] = React.useState<Project | null>(null)
  const [teamDialogOpen, setTeamDialogOpen] = React.useState(false)

  React.useEffect(() => {
    WorkspaceService.getAll()
      .then(setWorkspaces)
      .finally(() => setLoading(false))
    UserService.getAll().then(setAllUsers)
    ProjectService.getAllProjects().then(setAllProjects)
  }, [])

  const loadMembers = async (ws: Workspace) => {
    setSelectedWs(ws)
    setMembersLoading(true)
    setWsProjectsLoading(true)
    WorkspaceService.getMembers(ws.id)
      .then(setMembers)
      .finally(() => setMembersLoading(false))
    ProjectService.getProjectsByWorkspace(ws.id)
      .then(setWsProjects)
      .finally(() => setWsProjectsLoading(false))
  }

  // Auto-generate slug from name
  const handleNameChange = (v: string) => {
    setWsName(v)
    setWsSlug(v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))
  }

  const handleCreate = async () => {
    setCreating(true)
    setCreateError("")
    try {
      const ws = await WorkspaceService.create({ name: wsName, slug: wsSlug, description: wsDesc })
      setWorkspaces(prev => [...prev, ws])
      setCreateOpen(false)
      setWsName(""); setWsSlug(""); setWsDesc("")
    } catch (e: unknown) {
      setCreateError((e as Error).message)
    } finally {
      setCreating(false)
    }
  }

  const handleAddMember = async () => {
    if (!selectedWs || !selectedUserId) return
    setAddingMember(true)
    setAddMemberError("")
    try {
      const member = await WorkspaceService.addMember(selectedWs.id, { userId: selectedUserId, role: selectedRole as 'owner' | 'admin' | 'member' | 'viewer' })
      const user = allUsers.find(u => u.id === selectedUserId)
      setMembers(prev => [...prev, { ...member, user }])
      setAddMemberOpen(false)
      setSelectedUserId("")
      setSelectedRole("member")
    } catch (e: unknown) {
      setAddMemberError((e as Error).message)
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!selectedWs) return
    await WorkspaceService.removeMember(selectedWs.id, userId)
    setMembers(prev => prev.filter(m => m.userId !== userId))
  }

  const handleLinkProject = async () => {
    if (!selectedWs || !linkProjectId) return
    setLinkingProject(true)
    try {
      const updated = await ProjectService.updateProject(linkProjectId, { workspaceId: selectedWs.id } as Parameters<typeof ProjectService.updateProject>[1])
      setWsProjects(prev => [...prev, updated])
      setAllProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
      setLinkProjectOpen(false)
      setLinkProjectId("")
    } finally {
      setLinkingProject(false)
    }
  }

  const handleUnlinkProject = async (projectId: string) => {
    await ProjectService.updateProject(projectId, { workspaceId: undefined } as Parameters<typeof ProjectService.updateProject>[1])
    setWsProjects(prev => prev.filter(p => p.id !== projectId))
    setAllProjects(prev => prev.map(p => p.id === projectId ? { ...p, workspaceId: undefined } : p))
  }

  const openTeamDialog = (project: Project) => {
    setTeamProject(project)
    setTeamDialogOpen(true)
  }

  const handleTeamUpdate = (updatedProject: Project) => {
    setWsProjects(prev => prev.map(project =>
      project.id === updatedProject.id ? updatedProject : project
    ))
    setAllProjects(prev => prev.map(project =>
      project.id === updatedProject.id ? updatedProject : project
    ))
    setTeamProject(updatedProject)
  }

  const unlinkableProjects = allProjects.filter(p => !wsProjects.some(wp => wp.id === p.id))

  const availableUsers = allUsers.filter(u => !members.some(m => m.userId === u.id))

  const copySlug = (slug: string) => {
    navigator.clipboard.writeText(slug)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Lista de workspaces */}
      <div className="w-80 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm">Workspaces</h2>
            <p className="text-xs text-muted-foreground">{workspaces.length} en total</p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Nuevo
          </Button>
        </div>

        <div className="space-y-2">
          {workspaces.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Building2 className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No hay workspaces</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setCreateOpen(true)}>
                  Crear el primero
                </Button>
              </CardContent>
            </Card>
          )}
          {workspaces.map(ws => (
            <button
              key={ws.id}
              onClick={() => loadMembers(ws)}
              className={`w-full text-left rounded-xl border p-4 transition-all hover:shadow-sm ${
                selectedWs?.id === ws.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/10 text-primary font-bold text-sm shrink-0">
                  {ws.name[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{ws.name}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="truncate font-mono">/{ws.slug}</span>
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${selectedWs?.id === ws.id ? "rotate-90 text-primary" : ""}`} />
              </div>
            </button>
          ))}
        </div>
      </div>

      <Separator orientation="vertical" className="h-auto" />

      {/* Panel derecho - Detalle del workspace */}
      <div className="flex-1 min-w-0">
        {!selectedWs ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Selecciona un workspace</p>
            <p className="text-xs text-muted-foreground mt-1">para ver y gestionar sus miembros</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header del workspace */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-primary/20 to-primary/10 text-primary font-bold text-lg">
                  {selectedWs.name[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold">{selectedWs.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      /{selectedWs.slug}
                    </span>
                    <button onClick={() => copySlug(selectedWs.slug)} className="text-muted-foreground hover:text-foreground transition-colors">
                      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {selectedWs.description && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedWs.description}</p>
                  )}
                </div>
              </div>
              <Button size="sm" onClick={() => setAddMemberOpen(true)}>
                <UserPlus className="h-3.5 w-3.5 mr-1" /> Añadir miembro
              </Button>
            </div>

            <Separator />

            {/* Miembros */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-sm">Miembros</h3>
                  <p className="text-xs text-muted-foreground">{members.length} miembro{members.length !== 1 ? "s" : ""}</p>
                </div>
              </div>

              {membersLoading ? (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-xl text-center">
                  <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Sin miembros aún</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => setAddMemberOpen(true)}>
                    <UserPlus className="h-3.5 w-3.5 mr-1" /> Añadir el primero
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map(m => {
                    const name = m.user?.name ?? m.userId
                    const email = m.user?.email ?? ""
                    return (
                      <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors group">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                            {initials(name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{name}</div>
                          {email && <div className="text-xs text-muted-foreground truncate">{email}</div>}
                        </div>
                        <RoleBadge role={m.role} />
                        <button
                          onClick={() => handleRemoveMember(m.userId)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Proyectos */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-sm">Proyectos</h3>
                  <p className="text-xs text-muted-foreground">{wsProjects.length} proyecto{wsProjects.length !== 1 ? "s" : ""} vinculado{wsProjects.length !== 1 ? "s" : ""}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setLinkProjectId(""); setLinkProjectOpen(true) }}>
                  <Link2 className="h-3.5 w-3.5 mr-1" /> Vincular proyecto
                </Button>
              </div>

              {wsProjectsLoading ? (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : wsProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 border border-dashed rounded-xl text-center">
                  <FolderOpen className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Sin proyectos vinculados</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => setLinkProjectOpen(true)}>
                    <Link2 className="h-3.5 w-3.5 mr-1" /> Vincular el primero
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {wsProjects.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors group">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs shrink-0">
                        {p.key ?? p.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.status} · {p.businessUnit}</div>
                      </div>
                      {p.key && (
                        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded shrink-0">{p.key}</span>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => openTeamDialog(p)}
                      >
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        Equipo ({p.teamMembers?.length ?? 0})
                      </Button>
                      <button
                        onClick={() => handleUnlinkProject(p.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 rounded"
                        title="Desvincular proyecto"
                      >
                        <Unlink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dialog: Crear workspace */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ws-name">Nombre</Label>
              <Input id="ws-name" placeholder="Mi Empresa" value={wsName} onChange={e => handleNameChange(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ws-slug">Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">/</span>
                <Input id="ws-slug" placeholder="mi-empresa" value={wsSlug} onChange={e => setWsSlug(e.target.value)} className="font-mono" />
              </div>
              <p className="text-xs text-muted-foreground">Solo letras minúsculas, números y guiones.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ws-desc">Descripción <span className="text-muted-foreground">(opcional)</span></Label>
              <Textarea id="ws-desc" placeholder="Descripción del workspace..." value={wsDesc} onChange={e => setWsDesc(e.target.value)} rows={2} />
            </div>
            {createError && <p className="text-xs text-destructive">{createError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating || !wsName || !wsSlug}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Crear Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Añadir miembro */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Añadir miembro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Usuario</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un usuario..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      <div className="flex flex-col">
                        <span>{u.name}</span>
                        <span className="text-xs text-muted-foreground">{u.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {availableUsers.length === 0 && (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      Todos los usuarios ya son miembros
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {addMemberError && <p className="text-xs text-destructive">{addMemberError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddMember} disabled={addingMember || !selectedUserId}>
              {addingMember ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Añadir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Vincular proyecto */}
      <Dialog open={linkProjectOpen} onOpenChange={setLinkProjectOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Vincular proyecto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Selecciona un proyecto para vincularlo a <span className="font-medium text-foreground">{selectedWs?.name}</span>.
            </p>
            <div className="space-y-1.5">
              <Label>Proyecto</Label>
              <Select value={linkProjectId} onValueChange={setLinkProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un proyecto..." />
                </SelectTrigger>
                <SelectContent>
                  {unlinkableProjects.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        {p.key && <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{p.key}</span>}
                        <span>{p.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                  {unlinkableProjects.length === 0 && (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      Todos los proyectos ya están vinculados
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkProjectOpen(false)}>Cancelar</Button>
            <Button onClick={handleLinkProject} disabled={linkingProject || !linkProjectId}>
              {linkingProject ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Link2 className="h-4 w-4 mr-2" />}
              Vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditTeamMembersDialog
        project={teamProject}
        open={teamDialogOpen}
        onOpenChange={setTeamDialogOpen}
        onSave={handleTeamUpdate}
        workspaceId={selectedWs?.id}
        workspaceName={selectedWs?.name}
      />
    </div>
  )
}
