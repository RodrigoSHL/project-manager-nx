'use client'

import * as React from 'react'
import { Bug, BookOpen, CheckSquare, Layers, GripVertical, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Ticket, 
  TicketType, 
  TicketPriority, 
  users, 
  priorityConfig, 
  typeConfig,
  comments
} from '@/lib/mock-data'
import type { ApiTicket } from '@/types/project'

interface TicketCardProps {
  ticket: ApiTicket
  onClick: () => void
  variant?: 'board' | 'list'
  isDragging?: boolean
}

const typeIcons: Record<TicketType, React.ElementType> = {
  task: CheckSquare,
  bug: Bug,
  story: BookOpen,
  epic: Layers,
}

export function TicketCard({ ticket, onClick, variant = 'board', isDragging = false }: TicketCardProps) {
  const assignee = ticket.assigneeId ? users.find(u => u.id === ticket.assigneeId) : null
  const TypeIcon = typeIcons[ticket.type] ?? CheckSquare
  const priority = priorityConfig[ticket.priority as keyof typeof priorityConfig] ?? { label: ticket.priority, color: 'text-muted-foreground', icon: '○' }
  const type = typeConfig[ticket.type as keyof typeof typeConfig] ?? { label: ticket.type, color: 'text-muted-foreground', bgColor: 'bg-muted' }
  const ticketComments = comments.filter(c => c.ticketId === ticket.id)

  if (variant === 'list') {
    return (
      <TooltipProvider>
        <Card
          className={cn(
            "group flex items-center gap-4 p-3 cursor-pointer transition-all duration-200",
            "hover:shadow-md hover:border-primary/20 hover:bg-accent/30",
            isDragging && "shadow-lg ring-2 ring-primary/20 rotate-1"
          )}
          onClick={onClick}
        >
          {/* Drag Handle */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Type Icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn("p-1.5 rounded", type.bgColor)}>
                <TypeIcon className={cn("h-3.5 w-3.5", type.color)} />
              </div>
            </TooltipTrigger>
            <TooltipContent>{type.label}</TooltipContent>
          </Tooltip>

          {/* Key */}
          <span className="text-xs font-mono text-muted-foreground w-20 shrink-0">
            {ticket.key}
          </span>

          {/* Title */}
          <span className="flex-1 text-sm font-medium truncate">
            {ticket.title}
          </span>

          {/* Labels */}
          <div className="hidden lg:flex items-center gap-1.5">
            {ticket.labels.slice(0, 2).map((label) => (
              <Badge key={label.id} variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                {label.name}
              </Badge>
            ))}
            {ticket.labels.length > 2 && (
              <span className="text-xs text-muted-foreground">+{ticket.labels.length - 2}</span>
            )}
          </div>

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

          {/* Priority */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn("text-sm", priority.color)}>{priority.icon}</span>
            </TooltipTrigger>
            <TooltipContent>{priority.label}</TooltipContent>
          </Tooltip>

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
