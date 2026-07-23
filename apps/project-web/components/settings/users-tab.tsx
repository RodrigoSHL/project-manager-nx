"use client"

import * as React from "react"
import { Check, Plus, Users, Trash2, Mail, Loader2, Search, ShieldCheck, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { UserService, type User, type CreateUserDto, type UserRole } from "@/services/userService"

const roleOptions: Array<{ value: UserRole; label: string; description: string; icon: React.ElementType }> = [
  { value: "user", label: "Usuario", description: "Acceso base a ProjectHub", icon: UserRound },
  { value: "admin", label: "Administrador", description: "Gestiona usuarios y configuración", icon: ShieldCheck },
]

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

const avatarColors = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-green-100 text-green-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
]

function avatarColor(name: string) {
  const idx = name.charCodeAt(0) % avatarColors.length
  return avatarColors[idx]
}

export function UsersTab() {
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [createError, setCreateError] = React.useState("")
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)

  // Form
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [avatarUrl, setAvatarUrl] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [passwordConfirmation, setPasswordConfirmation] = React.useState("")
  const [roles, setRoles] = React.useState<UserRole[]>(["user"])

  React.useEffect(() => {
    UserService.getAll()
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    const normalizedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()
    if (password.length < 8) {
      setCreateError("La contraseña debe tener al menos 8 caracteres")
      return
    }
    if (password !== passwordConfirmation) {
      setCreateError("Las contraseñas no coinciden")
      return
    }
    if (roles.length === 0) {
      setCreateError("Selecciona al menos un rol")
      return
    }

    setCreating(true)
    setCreateError("")
    try {
      const dto: CreateUserDto = {
        name: normalizedName,
        email: normalizedEmail,
        password,
        roles,
        ...(avatarUrl.trim() ? { avatarUrl: avatarUrl.trim() } : {}),
      }
      const user = await UserService.create(dto)
      setUsers(prev => [user, ...prev])
      setCreateOpen(false)
      setName(""); setEmail(""); setAvatarUrl(""); setPassword(""); setPasswordConfirmation(""); setRoles(["user"])
    } catch (error: unknown) {
      setCreateError(error instanceof Error ? error.message : "No se pudo crear el usuario")
    } finally {
      setCreating(false)
    }
  }

  const toggleRole = (role: UserRole) => {
    setRoles(current => current.includes(role)
      ? current.filter(candidate => candidate !== role)
      : [...current, role])
  }

  const handleRemove = async (id: string) => {
    await UserService.remove(id)
    setUsers(prev => prev.filter(u => u.id !== id))
    if (selectedUser?.id === id) setSelectedUser(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex gap-6">
      {/* Lista */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nuevo usuario
          </Button>
        </div>

        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium text-sm">
                {search ? "Sin resultados" : "No hay usuarios"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? "Prueba con otra búsqueda" : "Crea el primer usuario del sistema"}
              </p>
              {!search && (
                <Button size="sm" variant="outline" className="mt-4" onClick={() => setCreateOpen(true)}>
                  Crear usuario
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(user => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`text-left rounded-xl border p-4 transition-all hover:shadow-sm group ${
                  selectedUser?.id === user.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="rounded-full object-cover" />
                    ) : (
                      <AvatarFallback className={`text-sm font-semibold ${avatarColor(user.name)}`}>
                        {initials(user.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm truncate">{user.name}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {user.roles.map(role => (
                        <Badge key={role} variant="secondary" className="px-1.5 py-0 text-[10px] capitalize">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Panel detalle */}
      {selectedUser && (
        <>
          <Separator orientation="vertical" className="h-auto" />
          <div className="w-72 shrink-0 space-y-5">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-sm">Detalle del usuario</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col items-center gap-3 py-4">
              <Avatar className="h-16 w-16">
                {selectedUser.avatarUrl ? (
                  <img src={selectedUser.avatarUrl} alt={selectedUser.name} className="rounded-full object-cover" />
                ) : (
                  <AvatarFallback className={`text-xl font-bold ${avatarColor(selectedUser.name)}`}>
                    {initials(selectedUser.name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="text-center">
                <div className="font-semibold">{selectedUser.name}</div>
                <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                <div className="mt-2 flex justify-center gap-1">
                  {selectedUser.roles.map(role => (
                    <Badge key={role} variant={role === "admin" ? "default" : "secondary"} className="capitalize">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded truncate max-w-35">{selectedUser.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creado</span>
                <span>{new Date(selectedUser.createdAt).toLocaleDateString("es")}</span>
              </div>
            </div>

            <Separator />

            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => handleRemove(selectedUser.id)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar usuario
            </Button>
          </div>
        </>
      )}

      {/* Dialog: Crear usuario */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="u-name">Nombre completo</Label>
              <Input id="u-name" placeholder="Juan García" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-email">Email</Label>
              <Input id="u-email" type="email" placeholder="juan@empresa.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-avatar">Avatar URL <span className="text-muted-foreground">(opcional)</span></Label>
              <Input id="u-avatar" placeholder="https://..." value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-password">Contraseña inicial</Label>
              <Input
                id="u-password"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-password-confirmation">Confirmar contraseña</Label>
              <Input
                id="u-password-confirmation"
                type="password"
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={e => setPasswordConfirmation(e.target.value)}
              />
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Roles</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {roleOptions.map(option => {
                  const selected = roles.includes(option.value)
                  const RoleIcon = option.icon
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleRole(option.value)}
                      className={`relative rounded-lg border p-3 text-left transition-colors ${
                        selected ? "border-primary bg-primary/5" : "hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <RoleIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">{option.label}</span>
                        {selected && <Check className="ml-auto h-4 w-4 text-primary" />}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground">Puedes seleccionar uno o ambos roles.</p>
            </fieldset>
            {createError && <p className="text-xs text-destructive">{createError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !name.trim() || !email.trim() || !password || !passwordConfirmation || roles.length === 0}
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Crear usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
