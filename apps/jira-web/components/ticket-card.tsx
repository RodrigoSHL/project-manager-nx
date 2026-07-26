'use client'

import * as React from 'react'
import { Bug, BookOpen, CheckSquare, Layers, GripVertical, MessageSquare, LifeBuoy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  TicketType, 
  users, 
  priorityConfig, 
  typeConfig,
  comments
} from '@/lib/mock-data'
import { findTeamMemberByAssigneeId } from '@/lib/team-members'
import type { ApiTeamMember, ApiTicket } from '@/types/project'

interface TicketCardProps {
  ticket: ApiTicket
  onClick: () => void
  variant?: 'board' | 'list'
  isDragging?: boolean
  teamMembers?: ApiTeamMember[]
}

const typeIcons: Record<TicketType, React.ElementType> = {
  task: CheckSquare,
  bug: Bug,
  story: BookOpen,
  epic: Layers,
  subtask: CheckSquare,
  support: LifeBuoy,
}

export function TicketCard({ ticket, onClick, variant = 'board', isDragging = false, teamMembers = [] }: TicketCardProps) {
  const assignee = findTeamMemberByAssigneeId(teamMembers, ticket.assigneeId)
    ?? (ticket.assigneeId ? users.find(u => u.id === ticket.assigneeId) : null)
  const TypeIcon = typeIcons[ticket.type] ?? CheckSquare
  const priority = priorityConfig[ticket.priority as keyof typeof priorityConfig] ?? { label: ticket.priority, color: 'text-muted-foreground', icon: '○' }
  const type = typeConfig[ticket.type as keyof typeof typeConfig] ?? { label: ticket.type, color: 'text-muted-foreground', bgColor: 'bg-muted' }
  const ticketComments = comments.filter(c => c.ticketId === ticket.id)

  if (variant === 'list') {
    return (
      <TooltipProvider>
        <Card
          className={cn(
            "group flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-all duration-200 border-l-2",
            "hover:shadow-md hover:border-primary/40 hover:bg-accent/40",
            "border-l-muted-foreground/20 hover:border-l-primary",
            isDragging && "shadow-lg ring-2 ring-primary/20"
          )}
          onClick={onClick}
        >
          {/* Drag Handle */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
          </div>

          {/* Type Icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn("p-1 rounded-md shrink-0", type.bgColor)}>
                <TypeIcon className={cn("h-3 w-3", type.color)} />
              </div>
            </TooltipTrigger>
            <TooltipContent>{type.label}</TooltipContent>
          </Tooltip>

          {/* Key */}
          <span className="text-xs font-mono text-muted-foreground w-16 shrink-0 bg-muted/40 px-1.5 py-0.5 rounded">
            {ticket.key}
          </span>

          {/* Title */}
          <span className="flex-1 text-sm font-medium truncate min-w-0">
            {ticket.title}
          </span>

          {/* Priority Badge */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={cn(
                  "h-5 px-1.5 text-[10px] font-semibold shrink-0 border",
                  priority.label === 'Urgent' && "bg-destructive/10 text-destructive border-destructive/30",
                  priority.label === 'High' && "bg-orange-500/10 text-orange-600 border-orange-500/30",
                  priority.label === 'Medium' && "bg-amber-500/10 text-amber-600 border-amber-500/30",
                  priority.label === 'Low' && "bg-muted text-muted-foreground border-muted"
                )}
              >
                {priority.icon}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>{priority.label}</TooltipContent>
          </Tooltip>

          {/* Story Points */}
          {ticket.storyPoints && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-5 w-5 flex items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20 shrink-0">
                  {ticket.storyPoints}
                </div>
              </TooltipTrigger>
              <TooltipContent>Story Points</TooltipContent>
            </Tooltip>
          )}

          {/* Assignee */}
          {assignee ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-5 w-5 shrink-0 ring-1 ring-border">
                  <AvatarImage src={assignee.avatar} alt={assignee.name} />
                  <AvatarFallback className="text-[9px] font-bold">{assignee.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>{assignee.name}</TooltipContent>
            </Tooltip>
          ) : (
            <div className="h-5 w-5 rounded-full border-2 border-dashed border-muted-foreground/30 shrink-0" />
          )}
        </Card>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Card
        className={cn(
          "group p-3 cursor-pointer transition-all duration-200",
          "hover:shadow-md hover:border-primary/20 hover:bg-accent/30",
          isDragging && "shadow-lg ring-2 ring-primary/20"
        )}
        onClick={onClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn("p-1 rounded", type.bgColor)}>
                  <TypeIcon className={cn("h-3 w-3", type.color)} />
                </div>
              </TooltipTrigger>
              <TooltipContent>{type.label}</TooltipContent>
            </Tooltip>
            <span className="text-xs font-mono text-muted-foreground">{ticket.key}</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn("text-sm", priority.color)}>{priority.icon}</span>
            </TooltipTrigger>
            <TooltipContent>{priority.label}</TooltipContent>
          </Tooltip>
        </div>

        {/* Title */}
        <h4 className="text-sm font-medium leading-snug mb-3 line-clamp-2 text-balance">
          {ticket.title}
        </h4>

        {/* Labels */}
        {(ticket.labels?.length ?? 0) > 0 && (
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {ticket.labels.slice(0, 3).map((label) => (
              <Badge key={label.id} variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                {label.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            {/* Story Points */}
            {ticket.storyPoints && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="h-5 w-5 p-0 justify-center text-[10px] font-medium rounded-full">
                    {ticket.storyPoints}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Story Points</TooltipContent>
              </Tooltip>
            )}

            {/* Comments */}
            {ticketComments.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {ticketComments.length}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{ticketComments.length} comentarios</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Assignee */}
          {assignee ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={assignee.avatar} alt={assignee.name} />
                  <AvatarFallback className="text-[10px]">{assignee.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>{assignee.name}</TooltipContent>
            </Tooltip>
          ) : (
            <div className="h-6 w-6 rounded-full border-2 border-dashed border-muted-foreground/30" />
          )}
        </div>
      </Card>
    </TooltipProvider>
  )
}
