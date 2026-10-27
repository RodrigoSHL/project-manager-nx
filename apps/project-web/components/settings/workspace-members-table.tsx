"use client"

import * as React from "react"
import { Crown, Eye, Loader2, Pencil, Shield, Trash2, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PeopleDirectoryTable } from "@/components/people-directory-table"
import type { WorkspaceMember } from "@/services/userService"

export const workspaceRoleConfig = {
  owner:  { label: "Owner", icon: Crown, color: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300" },
  admin:  { label: "Admin", icon: Shield, color: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300" },
  member: { label: "Member", icon: UserRound, color: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300" },
  viewer: { label: "Viewer", icon: Eye, color: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-400/20 dark:bg-slate-400/10 dark:text-slate-300" },
}

interface WorkspaceMembersTableProps {
  members: WorkspaceMember[]
  onEditRole: (member: WorkspaceMember) => void
  onRemoveMember: (userId: string) => Promise<void>
}

export function WorkspaceMembersTable({ members, onEditRole, onRemoveMember }: WorkspaceMembersTableProps) {
  const [removingUserId, setRemovingUserId] = React.useState<string | null>(null)
  const [removeError, setRemoveError] = React.useState("")

  const removeMember = async (userId: string) => {
    if (removingUserId) return
    setRemovingUserId(userId)
    setRemoveError("")
    try {
      await onRemoveMember(userId)
    } catch (error) {
      setRemoveError(error instanceof Error ? error.message : "No se pudo eliminar al miembro. Intenta nuevamente.")
    } finally {
      setRemovingUserId(null)
    }
  }

  return <PeopleDirectoryTable items={members} noun="miembros" tableLabel="Miembros del workspace"
    roleConfig={workspaceRoleConfig} getRoles={member => [member.role]} error={removeError}
    getIdentity={member => ({ id: member.id, name: member.user?.name ?? member.userId, email: member.user?.email ?? "", avatarUrl: member.user?.avatarUrl })}
    renderActions={member => {
      const name = member.user?.name ?? member.userId
      return <>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted" onClick={() => onEditRole(member)} disabled={removingUserId === member.userId} aria-label={`Editar rol de ${name}`}>
              <Pencil className="size-4" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Editar rol</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/40 dark:hover:bg-destructive/10" onClick={() => removeMember(member.userId)} disabled={removingUserId !== null} aria-label={`Eliminar a ${name} del workspace`}>
              {removingUserId === member.userId ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Eliminar del workspace</TooltipContent>
        </Tooltip>
      </>
    }} />
}
