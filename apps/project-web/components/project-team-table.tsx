"use client"

import { Trash2 } from "lucide-react"
import { PeopleDirectoryTable } from "@/components/people-directory-table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { TEAM_ROLES, teamRoleConfig } from "@/lib/team-roles"
import type { TeamMember } from "@/types/project"

interface ProjectTeamTableProps {
  members: TeamMember[]
  onRoleChange?: (id: string, role: string) => void
  onRemoveMember?: (id: string) => void
  disabled?: boolean
}

export function ProjectTeamTable({ members, onRoleChange, onRemoveMember, disabled }: ProjectTeamTableProps) {
  return <PeopleDirectoryTable items={members} noun="participantes" tableLabel="Equipo responsable"
    getIdentity={member => ({ ...member, avatarUrl: member.avatar, detail: member.phone ? <a href={`tel:${member.phone}`} className="text-xs text-muted-foreground hover:underline">{member.phone}</a> : undefined })}
    getRoles={member => [member.role]} roleConfig={teamRoleConfig}
    renderRoles={onRoleChange ? member => <Select value={member.role} onValueChange={role => onRoleChange(member.id, role)} disabled={disabled}>
      <SelectTrigger aria-label={`Rol de ${member.name}`} className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>{TEAM_ROLES.map(role => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}</SelectContent>
    </Select> : undefined}
    renderActions={onRemoveMember ? member => <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive" disabled={disabled} onClick={() => onRemoveMember(member.id)} aria-label={`Quitar a ${member.name} del proyecto`}>
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Quitar del proyecto</TooltipContent>
    </Tooltip> : undefined} />
}
