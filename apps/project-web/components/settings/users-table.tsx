"use client"

import * as React from "react"
import { Eye, Loader2, ShieldCheck, Trash2, UserRound } from "lucide-react"
import { PeopleDirectoryTable } from "@/components/people-directory-table"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { User } from "@/services/userService"

const roleConfig = {
  user: { label: "Usuario", icon: UserRound, color: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300" },
  admin: { label: "Administrador", icon: ShieldCheck, color: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300" },
}

interface UsersTableProps {
  users: User[]
  onSelectUser: (user: User) => void
  onRemoveUser: (id: string) => Promise<void>
}

export function UsersTable({ users, onSelectUser, onRemoveUser }: UsersTableProps) {
  const [removingId, setRemovingId] = React.useState<string | null>(null)
  const [error, setError] = React.useState("")
  const removeUser = async (id: string) => {
    if (removingId) return
    setRemovingId(id)
    setError("")
    try { await onRemoveUser(id) }
    catch (error) { setError(error instanceof Error ? error.message : "No se pudo eliminar al usuario.") }
    finally { setRemovingId(null) }
  }

  return <PeopleDirectoryTable items={users} noun="usuarios" tableLabel="Usuarios del sistema"
    getIdentity={user => user} getRoles={user => user.roles} roleConfig={roleConfig} error={error}
    renderActions={user => <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="rounded-lg text-muted-foreground hover:text-foreground" onClick={() => onSelectUser(user)} aria-label={`Ver detalle de ${user.name}`}>
            <Eye className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Ver detalle</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" disabled={removingId !== null} onClick={() => removeUser(user.id)} aria-label={`Eliminar usuario ${user.name}`}>
            {removingId === user.id ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Eliminar usuario</TooltipContent>
      </Tooltip>
    </>} />
}
