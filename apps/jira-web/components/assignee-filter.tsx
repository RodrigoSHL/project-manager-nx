'use client'

import { UserRoundX, Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { getTeamMemberAssigneeId } from '@/lib/team-members'
import type { ApiTeamMember } from '@/types/project'

interface AssigneeFilterProps {
  members: ApiTeamMember[]
  values: string[]
  onChange: (values: string[]) => void
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')
}

export function AssigneeFilter({ members, values, onChange }: AssigneeFilterProps) {
  const toggle = (assigneeId: string) => {
    onChange(
      values.includes(assigneeId)
        ? values.filter(value => value !== assigneeId)
        : [...values, assigneeId],
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card px-3 py-2.5">
      <div className="mr-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Users className="h-4 w-4" />
        Responsables
      </div>

      <Button
        type="button"
        size="sm"
        variant={values.length === 0 ? 'secondary' : 'ghost'}
        className="h-8 px-3 text-xs"
        onClick={() => onChange([])}
      >
        Todos
      </Button>

      <TooltipProvider>
        <div className="flex items-center -space-x-1">
          {members.map(member => {
            const assigneeId = getTeamMemberAssigneeId(member)
            const selected = values.includes(assigneeId)

            return (
              <Tooltip key={member.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={`Filtrar por ${member.name}`}
                    aria-pressed={selected}
                    onClick={() => toggle(assigneeId)}
                    className={cn(
                      'relative rounded-full p-0.5 transition-all hover:z-10 hover:scale-105',
                      selected
                        ? 'z-10 bg-primary ring-2 ring-primary/25'
                        : 'bg-background ring-1 ring-border',
                    )}
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="text-[10px] font-semibold">
                        {initials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{member.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {member.role.replaceAll('_', ' ')}
                  </p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>

      <Button
        type="button"
        size="sm"
        variant={values.includes('unassigned') ? 'secondary' : 'ghost'}
        className="h-8 gap-1.5 px-2.5 text-xs"
        onClick={() => toggle('unassigned')}
      >
        <UserRoundX className="h-3.5 w-3.5" />
        Sin asignar
      </Button>

      {members.length === 0 && (
        <span className="text-xs text-muted-foreground">
          Agrega miembros al equipo del proyecto para poder asignar tickets.
        </span>
      )}
    </div>
  )
}
